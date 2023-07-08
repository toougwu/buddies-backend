import { Request, Response } from 'express';
import { config } from '@config/config';
import JWT from 'jsonwebtoken';
import { validate } from '@globals/decorators/validation-decorator';
import HTTP_STATUS from 'http-status-codes';
import { authService } from '@services/database/auth-service';
import { loginValidatorSchema } from '@auth/validators/login-validator';
import { IAuthDoc } from '@auth/interfaces/auth-interface';
import { BadRequestError } from '@globals/helpers/error-handler';
import { userService } from '@services/database/user-service';
import { IUserDoc } from '@user/interfaces/user-interface';

export class Login {
  @validate(loginValidatorSchema)
  public async loginAccount(req: Request, res: Response): Promise<void> {
    const { username, password } = req.body;
    const existingUser: IAuthDoc = await authService.getAuthUserByUsername(username);

    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordsMatch: boolean = await existingUser.comparePassword(password);
    if (!passwordsMatch) {
      throw new BadRequestError('Invalid credentials');
    }
    const user: IUserDoc = await userService.getUserByAuthId(`${existingUser._id}`);
    const userJwt: string = JWT.sign(
      {
        id: user._id,
        uId: existingUser.uId,
        email: existingUser.email,
        username: existingUser.username,
        avatarColor: existingUser.avatarColor
      },
      config.jwtToken!
    );
    req.session = { jwt: userJwt };
    const userDocument: IUserDoc = {
      ...user,
      authId: existingUser!._id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarColor: existingUser!.avatarColor,
      uId: existingUser!.uId,
      createdAt: existingUser!.createdAt
    } as IUserDoc;
    res.status(HTTP_STATUS.OK).json({ message: 'User login successful', user: userDocument, token: userJwt });
  }
}
