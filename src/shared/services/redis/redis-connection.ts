import Logger from 'bunyan';
import { config } from '@config/config';
import { BaseCache } from '@services/redis/base-cache';

const log: Logger = config.createLogger('REDIS:CONN-LOG');

class RedisConnection extends BaseCache {
  constructor() {
    super('REDIS:CONN-LOG');
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      log.info(`Redis connection: ${await this.client.ping()}`);
    } catch (error) {
      log.error(error);
    }
  }
}

export const redisConnection: RedisConnection = new RedisConnection();
