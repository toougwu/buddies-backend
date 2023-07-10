import { Request, Response } from 'express';
import { config } from '@config/config';
import moment from 'moment';
import publicIP from 'ip';
import HTTP_STATUS from 'http-status-codes';
import { authService } from '@services/database/auth-service';
import { IAuthDoc } from '@auth/interfaces/auth-interface';
import { validate } from '@globals/decorators/validation-decorator';
import { emailValidatorSchema, passwordValidatorSchema } from '@auth/validators/reset-password-validator';
import crypto from 'crypto';
import { forgotPasswordTemplate } from '@services/emails/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@services/queues/email-queue';
import { IResetPasswordParams } from '@user/interfaces/user-interface';
import { resetPasswordTemplate } from '@services/emails/templates/reset-password/reset-password-template';
import { BadRequestError } from '@globals/helpers/error-handler';

export class PasswordResetController {
  @validate(emailValidatorSchema)
  public async sendResetLink(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const existingUser: IAuthDoc = await authService.getAuthUserByEmail(email);
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const randomBytes: Buffer = await Promise.resolve(crypto.randomBytes(20));
    const randomCharacters: string = randomBytes.toString('hex');
    await authService.updatePasswordToken(`${existingUser._id!}`, randomCharacters, Date.now() * 60 * 60 * 1000); //valid for 1 hour

    const resetLink = `${config.clientUrl}/reset-password?token=${randomCharacters}`;
    const template: string = forgotPasswordTemplate.passwordResetTemplate(
      existingUser.username!,
      `${config.appName}`,
      resetLink
    );
    emailQueue.addEmailJob('forgotPasswordEmail', { template, receiverEmail: email, subject: 'Reset your password' });
    res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent.' });
  }

  @validate(passwordValidatorSchema)
  public async updatePassword(req: Request, res: Response): Promise<void> {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;
    if (password !== confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }
    const existingUser: IAuthDoc = await authService.getAuthUserByPasswordToken(token);
    if (!existingUser) {
      throw new BadRequestError('Reset token has expired or invalid.');
    }

    existingUser.password = password;
    existingUser.passwordResetExpires = undefined;
    existingUser.passwordResetToken = undefined;
    await existingUser.save();

    const templateParams: IResetPasswordParams = {
      username: existingUser.username!,
      email: existingUser.email!,
      ipaddress: publicIP.address(),
      date: moment().format('DD//MM//YYYY HH:mm')
    };
    const template: string = resetPasswordTemplate.passwordResetConfirmationTemplate(
      `${config.appName}`,
      templateParams
    );
    emailQueue.addEmailJob('forgotPasswordEmail', {
      template,
      receiverEmail: existingUser.email!,
      subject: 'Password Reset Confirmation'
    });
    res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated.' });
  }
}
