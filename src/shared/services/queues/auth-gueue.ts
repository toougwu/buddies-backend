// import { IAuthJob } from '@auth/interfaces/auth.interface';
import { IAuthJob } from '@auth/interfaces/auth-interface';
import { BaseQueue } from '@services/queues/base-queue';
import { authWorker } from '@workers/auth-worker';

class AuthQueue extends BaseQueue {
  constructor() {
    super('auth');
    this.processJob('addAuthUserToDB', 5, authWorker.addAuthUserToDB);
  }

  public addAuthUserJob(name: string, data: IAuthJob): void {
    this.addJob(name, data);
  }
}

export const authQueue: AuthQueue = new AuthQueue();
