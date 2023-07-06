import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({});

class Config {
  public databaseUrl: string | undefined;
  public jwtToken: string | undefined;
  public nodeEnv: string | undefined;
  public secretKeyOne: string | undefined;
  public secretKeyTwo: string | undefined;
  public clientUrl: string | undefined;
  public redisHost: string | undefined;

  private readonly defaultDatabaseUrl = 'mongodb://127.0.0.1:27017/buddies-db';

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || this.defaultDatabaseUrl;
    this.jwtToken = process.env.JWT_TOKEN || '12345';
    this.nodeEnv = process.env.NODE_ENV || '';
    this.secretKeyOne = process.env.SECRET_KEY_ONE || '';
    this.secretKeyTwo = process.env.SECRET_KEY_TWO || '';
    this.clientUrl = process.env.CLIENT_URL || '';
    this.redisHost = process.env.REDIS_HOST || '';
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({ name, level: 'debug' });
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value == undefined) {
        throw new Error(`Config ${key} is undefined`);
      }
    }
  }
}

export const config: Config = new Config();
