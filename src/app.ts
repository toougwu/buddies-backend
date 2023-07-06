import express, { Express } from 'express';
import { BuddiesServer } from './config/setup-server';
import dbConnect from './config/setup-db';
import { config } from './config/config';

class MyApp {
  public init(): void {
    this.loadConfig();
    dbConnect();
    const app: Express = express();
    const server: BuddiesServer = new BuddiesServer(app);
    server.start();
  }

  private loadConfig(): void {
    config.validateConfig();
  }
}

const myApp: MyApp = new MyApp();
myApp.init();
