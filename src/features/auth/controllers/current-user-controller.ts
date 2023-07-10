import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { UserCache } from '@services/redis/user-cache';
import { IUserDoc } from '@user/interfaces/user-interface';
import { userService } from '@services/database/user-service';

const userCache: UserCache = new UserCache();

export class CurrentUserController {
  public async getUser(req: Request, res: Response): Promise<void> {
    let isUser = false;
    let token = null;
    let user = null;
    const cachedUser: IUserDoc = (await userCache.getUserFromCache(`${req.currentUser!.id}`)) as IUserDoc;
    const existingUser: IUserDoc = cachedUser ? cachedUser : await userService.getUserById(`${req.currentUser!.id}`);
    if (Object.keys(existingUser).length) {
      isUser = true;
      token = req.session?.jwt;
      user = existingUser;
    }
    res.status(HTTP_STATUS.OK).json({ token, isUser, user });
  }
}
