import mongoose from 'mongoose';
import { config } from '@config/config';
import Logger from 'bunyan';
import { redisConnection } from '@services/redis/redis-connection';

const log: Logger = config.createLogger('DATABASE-LOG');

// export as a default annonymous function
// with this, you can assign any identifier during import
export default () => {
  const connect = (): void => {
    mongoose
      .connect(`${config.databaseUrl}`)
      .then(() => {
        log.info('database connection established');
        // connect redis
        redisConnection.connect();
      })
      .catch((error) => {
        log.error('error connecting to database', error);
        return process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnected', connect);
};
