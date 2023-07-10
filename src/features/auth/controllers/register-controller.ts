import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { validate } from '@globals/decorators/validation-decorator';
import { registerValidatorSchema } from '@auth/validators/register-validator';
import { IAuthDoc, IRegistrationData } from '@auth/interfaces/auth-interface';
import { authService } from '@services/database/auth-service';
import { BadRequestError } from '@globals/helpers/error-handler';
import { CustomHelper } from '@globals/helpers/custom-helper';
import { UploadApiResponse } from 'cloudinary';
import { uploadToCloud } from '@globals/helpers/cloudinary-upload';
import { IUserDoc } from '@user/interfaces/user-interface';
import { UserCache } from '@services/redis/user-cache';
import { config } from '@config/config';
import { omit } from 'lodash';
import { authQueue } from '@services/queues/auth-queue';
import { userQueue } from '@services/queues/user-queue';
import JWT from 'jsonwebtoken';

const userCache: UserCache = new UserCache();

export class RegisterController {
  @validate(registerValidatorSchema)
  public async createAccount(req: Request, res: Response): Promise<void> {
    const { username, email, password, avatarColor, avatarImage } = req.body;

    const checkIfUserExists: IAuthDoc = await authService.getUserByUsernameOrEmail(username, email);

    if (checkIfUserExists) {
      throw new BadRequestError('User already exists');
    }

    const authObjectId: ObjectId = new ObjectId();
    const userObjectId: ObjectId = new ObjectId();
    const uId = `${CustomHelper.generateRandomIntegers(12)}`;
    // the reason we are using Register.prototype.registrationData and not this.registrationData is because
    // of how we invoke the createAccount method in the routes method.
    // the scope of the this object is not kept when the method is invoked
    const authData: IAuthDoc = RegisterController.prototype.registrationData({
      _id: authObjectId,
      uId: uId,
      username: username,
      email: email,
      password: password,
      avatarColor: avatarColor
    });

    const result: UploadApiResponse = (await uploadToCloud(
      avatarImage,
      `${userObjectId}`,
      true,
      true
    )) as UploadApiResponse;

    if (!result?.public_id) {
      throw new BadRequestError('File upload: Error occurred. Try again.');
    }

    // Add to redis cache
    const userDataForCache: IUserDoc = RegisterController.prototype.userData(authData, userObjectId);
    userDataForCache.profilePicture = `https://res.cloudinary.com/${config.cloudName}/image/upload/v${result.version}/${userObjectId}`;
    await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

    // Add to database
    omit(userDataForCache, ['uId', 'username', 'email', 'password', 'avatarColor']);
    authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });
    userQueue.addUserJob('addUserToDB', { value: userDataForCache });

    const userJwt: string = RegisterController.prototype.createToken(authData, userObjectId);
    req.session = { jwt: userJwt };
    res
      .status(HTTP_STATUS.CREATED)
      .json({ message: 'User created successfully', user: userDataForCache, token: userJwt });
    // res.status(HTTP_STATUS.CREATED).json({ message: 'User created successfully', authData});
  }

  private registrationData(data: IRegistrationData): IAuthDoc {
    const { _id, uId, username, email, password, avatarColor } = data;
    return {
      _id: _id,
      uId: uId,
      username: CustomHelper.ucFirst(username),
      email: CustomHelper.lowerCase(email),
      password: password,
      avatarColor: avatarColor,
      createdAt: new Date()
    } as IAuthDoc;
  }

  private createToken(data: IAuthDoc, userObjectId: ObjectId): string {
    return JWT.sign(
      {
        id: userObjectId,
        uId: data.uId,
        email: data.email,
        username: data.username,
        avatarColor: data.avatarColor
      },
      config.jwtToken!
    );
  }

  private userData(data: IAuthDoc, userObjectId: ObjectId): IUserDoc {
    const { _id, uId, username, email, password, avatarColor } = data;
    return {
      _id: userObjectId,
      authId: _id,
      uId,
      username,
      email,
      password,
      avatarColor,
      profilePicture: '',
      blocked: [],
      blockedBy: [],
      work: '',
      location: '',
      school: '',
      quote: '',
      bgImageVersion: '',
      bgImageId: '',
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      notifications: {
        messages: true,
        reactions: true,
        comments: true,
        follows: true
      },
      social: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: ''
      }
    } as unknown as IUserDoc;
  }
}
