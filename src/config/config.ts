import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

// loads .env file content into process.env
dotenv.config({});

class Config {
  public databaseUrl: string | undefined;
  public jwtToken: string | undefined;
  public nodeEnv: string | undefined;
  public secretKeyOne: string | undefined;
  public secretKeyTwo: string | undefined;
  public clientUrl: string | undefined;
  public redisHost: string | undefined;
  public cloudName: string | undefined;
  public cloudApiKey: string | undefined;
  public cloudApiSecret: string | undefined;

  private readonly defaultDatabaseUrl = 'mongodb://127.0.0.1:27017/buddies-db';

  constructor() {
    this.databaseUrl = process.env.DATABASE_URL || this.defaultDatabaseUrl;
    this.jwtToken = process.env.JWT_TOKEN || '12345';
    this.nodeEnv = process.env.NODE_ENV || '';
    this.secretKeyOne = process.env.SECRET_KEY_ONE || '';
    this.secretKeyTwo = process.env.SECRET_KEY_TWO || '';
    this.clientUrl = process.env.CLIENT_URL || '';
    this.redisHost = process.env.REDIS_HOST || '';
    this.cloudName = process.env.CLOUD_NAME || '';
    this.cloudApiKey = process.env.CLOUD_API_KEY || '';
    this.cloudApiSecret = process.env.CLOUD_API_SECRET || '';
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

  public cloudinaryConfig(): void {
    cloudinary.v2.config({
      cloud_name: this.cloudName,
      api_key: this.cloudApiKey,
      api_secret: this.cloudApiSecret
    });
  }
}

export const config: Config = new Config();
