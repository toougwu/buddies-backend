import { BaseQueue } from '@services/queues/base-queue';
// import { IUserJob } from '@user/interfaces/user-interface';
import { userWorker } from '@workers/user-worker';

class UserQueue extends BaseQueue {
  constructor() {
    super('user');
    this.processJob('addUserToDB', 5, userWorker.addUserToDB);
    // this.processJob('updateSocialLinksInDB', 5, userWorker.updateSocialLinks);
    // this.processJob('updateBasicInfoInDB', 5, userWorker.updateUserInfo);
    // this.processJob('updateNotificationSettings', 5, userWorker.updateNotificationSettings);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public addUserJob(name: string, data: any): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
