import { BaseCache } from '@services/redis/base-cache';
import { INotificationSettings, ISocialLinks, IUserDoc } from '@user/interfaces/user-interface';
import Logger from 'bunyan';
import { indexOf, findIndex } from 'lodash';
import { config } from '@config/config';
import { ServerError } from '@globals/helpers/error-handler';
import { CustomHelper } from '@globals/helpers/custom-helper';
import { RedisCommandRawReply } from '@redis/client/dist/lib/commands';

const log: Logger = config.createLogger('USER-CACHE');
type UserItem = string | ISocialLinks | INotificationSettings;
type UserCacheMultiType = string | number | Buffer | RedisCommandRawReply[] | IUserDoc | IUserDoc[];

export class UserCache extends BaseCache {
  constructor() {
    super('USER-CACHE');
  }

  // save the user to redis cache
  public async saveUserToCache(key: string, userUId: string, createdUser: IUserDoc): Promise<void> {
    const createdAt = new Date();
    const {
      _id,
      uId,
      username,
      email,
      avatarColor,
      blocked,
      blockedBy,
      postsCount,
      profilePicture,
      followersCount,
      followingCount,
      notifications,
      work,
      location,
      school,
      quote,
      bgImageId,
      bgImageVersion,
      social
    } = createdUser;
    const dataToSave = {
      _id: `${_id}`,
      uId: `${uId}`,
      username: `${username}`,
      email: `${email}`,
      avatarColor: `${avatarColor}`,
      createdAt: `${createdAt}`,
      postsCount: `${postsCount}`,
      blocked: JSON.stringify(blocked),
      blockedBy: JSON.stringify(blockedBy),
      profilePicture: `${profilePicture}`,
      followersCount: `${followersCount}`,
      followingCount: `${followingCount}`,
      notifications: JSON.stringify(notifications),
      social: JSON.stringify(social),
      work: `${work}`,
      location: `${location}`,
      school: `${school}`,
      quote: `${quote}`,
      bgImageVersion: `${bgImageVersion}`,
      bgImageId: `${bgImageId}`
    };

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      // add the sorted set usin ZADD
      // we will use the sorted set to fetch all the hash set
      await this.client.ZADD('user', { score: parseInt(userUId, 10), value: `${key}` });
      // add the hash set
      for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
        await this.client.HSET(`users:${key}`, `${itemKey}`, `${itemValue}`);
      }
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  // get the current user data from redis cache
  public async getUserFromCache(userId: string): Promise<IUserDoc | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }

      const response: IUserDoc = (await this.client.HGETALL(`users:${userId}`)) as unknown as IUserDoc;
      response.createdAt = new Date(CustomHelper.parseJson(`${response.createdAt}`));
      response.postsCount = CustomHelper.parseJson(`${response.postsCount}`);
      response.blocked = CustomHelper.parseJson(`${response.blocked}`);
      response.blockedBy = CustomHelper.parseJson(`${response.blockedBy}`);
      response.notifications = CustomHelper.parseJson(`${response.notifications}`);
      response.social = CustomHelper.parseJson(`${response.social}`);
      response.followersCount = CustomHelper.parseJson(`${response.followersCount}`);
      response.followingCount = CustomHelper.parseJson(`${response.followingCount}`);
      response.bgImageId = CustomHelper.parseJson(`${response.bgImageId}`);
      response.bgImageVersion = CustomHelper.parseJson(`${response.bgImageVersion}`);
      response.profilePicture = CustomHelper.parseJson(`${response.profilePicture}`);
      response.work = CustomHelper.parseJson(`${response.work}`);
      response.school = CustomHelper.parseJson(`${response.school}`);
      response.location = CustomHelper.parseJson(`${response.location}`);
      response.quote = CustomHelper.parseJson(`${response.quote}`);

      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getUsersFromCache(start: number, end: number, excludedUserKey: string): Promise<IUserDoc[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const response: string[] = await this.client.ZRANGE('user', start, end, { REV: true });
      const multi: ReturnType<typeof this.client.multi> = this.client.multi();
      for (const key of response) {
        if (key !== excludedUserKey) {
          multi.HGETALL(`users:${key}`);
        }
      }
      const replies: UserCacheMultiType = (await multi.exec()) as UserCacheMultiType;
      const userReplies: IUserDoc[] = [];
      for (const reply of replies as IUserDoc[]) {
        reply.createdAt = new Date(CustomHelper.parseJson(`${reply.createdAt}`));
        reply.postsCount = CustomHelper.parseJson(`${reply.postsCount}`);
        reply.blocked = CustomHelper.parseJson(`${reply.blocked}`);
        reply.blockedBy = CustomHelper.parseJson(`${reply.blockedBy}`);
        reply.notifications = CustomHelper.parseJson(`${reply.notifications}`);
        reply.social = CustomHelper.parseJson(`${reply.social}`);
        reply.followersCount = CustomHelper.parseJson(`${reply.followersCount}`);
        reply.followingCount = CustomHelper.parseJson(`${reply.followingCount}`);
        reply.bgImageId = CustomHelper.parseJson(`${reply.bgImageId}`);
        reply.bgImageVersion = CustomHelper.parseJson(`${reply.bgImageVersion}`);
        reply.profilePicture = CustomHelper.parseJson(`${reply.profilePicture}`);
        reply.work = CustomHelper.parseJson(`${reply.work}`);
        reply.school = CustomHelper.parseJson(`${reply.school}`);
        reply.location = CustomHelper.parseJson(`${reply.location}`);
        reply.quote = CustomHelper.parseJson(`${reply.quote}`);

        userReplies.push(reply);
      }
      return userReplies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getRandomUsersFromCache(userId: string, excludedUsername: string): Promise<IUserDoc[]> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const replies: IUserDoc[] = [];
      const followers: string[] = await this.client.LRANGE(`followers:${userId}`, 0, -1);
      const users: string[] = await this.client.ZRANGE('user', 0, -1);
      const randomUsers: string[] = CustomHelper.shuffle(users).slice(0, 10);
      for (const key of randomUsers) {
        const followerIndex = indexOf(followers, key);
        if (followerIndex < 0) {
          const userHash: IUserDoc = (await this.client.HGETALL(`users:${key}`)) as unknown as IUserDoc;
          replies.push(userHash);
        }
      }
      const excludedUsernameIndex: number = findIndex(replies, ['username', excludedUsername]);
      replies.splice(excludedUsernameIndex, 1);
      for (const reply of replies) {
        reply.createdAt = new Date(CustomHelper.parseJson(`${reply.createdAt}`));
        reply.postsCount = CustomHelper.parseJson(`${reply.postsCount}`);
        reply.blocked = CustomHelper.parseJson(`${reply.blocked}`);
        reply.blockedBy = CustomHelper.parseJson(`${reply.blockedBy}`);
        reply.notifications = CustomHelper.parseJson(`${reply.notifications}`);
        reply.social = CustomHelper.parseJson(`${reply.social}`);
        reply.followersCount = CustomHelper.parseJson(`${reply.followersCount}`);
        reply.followingCount = CustomHelper.parseJson(`${reply.followingCount}`);
        reply.bgImageId = CustomHelper.parseJson(`${reply.bgImageId}`);
        reply.bgImageVersion = CustomHelper.parseJson(`${reply.bgImageVersion}`);
        reply.profilePicture = CustomHelper.parseJson(`${reply.profilePicture}`);
        reply.work = CustomHelper.parseJson(`${reply.work}`);
        reply.school = CustomHelper.parseJson(`${reply.school}`);
        reply.location = CustomHelper.parseJson(`${reply.location}`);
        reply.quote = CustomHelper.parseJson(`${reply.quote}`);
      }
      return replies;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async updateSingleUserItemInCache(userId: string, prop: string, value: UserItem): Promise<IUserDoc | null> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      await this.client.HSET(`users:${userId}`, `${prop}`, JSON.stringify(value));
      const response: IUserDoc = (await this.getUserFromCache(userId)) as IUserDoc;
      return response;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }

  public async getTotalUsersInCache(): Promise<number> {
    try {
      if (!this.client.isOpen) {
        await this.client.connect();
      }
      const count: number = await this.client.ZCARD('user');
      return count;
    } catch (error) {
      log.error(error);
      throw new ServerError('Server error. Try again.');
    }
  }
}
