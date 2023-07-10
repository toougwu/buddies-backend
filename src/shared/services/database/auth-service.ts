import { IAuthDoc } from '@auth/interfaces/auth-interface';
import { AuthModel } from '@auth/models/auth-model';
import { CustomHelper } from '@globals/helpers/custom-helper';

class AuthService {
  public async createAuthUser(data: IAuthDoc): Promise<void> {
    await AuthModel.create(data);
  }

  public async getUserByUsernameOrEmail(username: string, email: string): Promise<IAuthDoc> {
    const query = {
      $or: [{ username: CustomHelper.ucFirst(username) }, { email: CustomHelper.lowerCase(email) }]
    };

    const user: IAuthDoc = (await AuthModel.findOne(query).exec()) as IAuthDoc;
    return user;
  }

  public async getAuthUserByUsername(username: string): Promise<IAuthDoc> {
    const user: IAuthDoc = (await AuthModel.findOne({ username: CustomHelper.ucFirst(username) }).exec()) as IAuthDoc;
    return user;
  }

  public async getAuthUserByEmail(email: string): Promise<IAuthDoc> {
    const user: IAuthDoc = (await AuthModel.findOne({ email: CustomHelper.lowerCase(email) }).exec()) as IAuthDoc;
    return user;
  }

  public async getAuthUserByPasswordToken(token: string): Promise<IAuthDoc> {
    const user: IAuthDoc = (await AuthModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() } //TODO: Check this expiry validation
    }).exec()) as IAuthDoc;
    return user;
  }

  public async updatePasswordToken(authId: string, token: string, tokenExpiration: number): Promise<void> {
    await AuthModel.updateOne(
      { _id: authId },
      {
        passwordResetToken: token,
        passwordResetExpires: tokenExpiration
      }
    );
  }

  public async updatePassword(username: string, hashedPassword: string): Promise<void> {
    await AuthModel.updateOne({ username }, { $set: { password: hashedPassword } }).exec();
  }
}

export const authService: AuthService = new AuthService();
