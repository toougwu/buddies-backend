import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';

import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import cookieSession from 'cookie-session';
import HTTP_STATUS from 'http-status-codes';
import compression from 'compression';
import 'express-async-errors';
import Logger from 'bunyan';
import { config } from '@config/config';
import appRoutes from '@routes/routes';
import { CustomError, IErrorResponse } from '@globals/helpers/error-handler';

const SERVER_PORT = 5000;
const log: Logger = config.createLogger('SERVER-LOG');

export class BuddiesServer {
  // this comes from express
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  // starts the server
  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routesMiddleware(this.app);
    this.globalErrHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    // to store user session information
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.secretKeyOne!, config.secretKeyTwo!],
        maxAge: 3600000 * 24 * 7,
        secure: config.nodeEnv != 'local'
        // sameSite: 'none' // comment this line when running the server locally
      })
    );
    // protects against HTTP Parameter Pollution attacks
    app.use(hpp());
    // set HTTP response headers.
    app.use(helmet());
    // enable cross-origin resource sharing
    app.use(
      cors({
        origin: config.clientUrl,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());
    app.use(json({ limit: '50mb' }));
    app.use(
      urlencoded({
        limit: '50mb',
        extended: true
      })
    );
  }

  private routesMiddleware(app: Application): void {
    appRoutes(app);
  }

  private globalErrHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }
      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    try {
      const httpServer: http.Server = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.clientUrl,
        methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE']
      }
    });
    const pubClient = createClient({ url: config.redisHost });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Server listening on port ${SERVER_PORT}`);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private socketIOConnections(io: Server): void {
    log.info('Connecting to socket');
  }
}
