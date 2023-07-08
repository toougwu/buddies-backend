import express, { Express } from 'express';
import { BuddiesServer } from '@config/setup-server';
import dbConnect from '@config/setup-db';
import { config } from '@config/config';

// entry point of the application
class MyApp {
  public init(): void {
    this.loadConfig();
    // connect mongodb & redis for im-memory cache
    dbConnect();
    // create an express application
    const app: Express = express();
    // create and start the server
    const server: BuddiesServer = new BuddiesServer(app);
    server.start();
  }

  // load config files
  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }
}

const myApp: MyApp = new MyApp();
myApp.init();
