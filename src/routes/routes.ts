import { authRoutes } from '@auth/routes/auth-routes';
import { getUserRoute } from '@auth/routes/get-user-route';
import { serverAdapter } from '@services/queues/base-queue';
import { authMiddleware } from '@globals/middlewares/auth-middleware';
import { Application } from 'express';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
  const routes = () => {
    app.use('/queues', serverAdapter.getRouter());
    app.use(BASE_PATH, authRoutes.routes());
    app.use(BASE_PATH, authRoutes.logoutRoute());

    app.use(BASE_PATH, authMiddleware.verifyUser, getUserRoute.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, followerRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, chatRoutes.routes());
    // app.use(BASE_PATH, authMiddleware.verifyUser, userRoutes.routes());

    // app.use('', healthRoutes.health());
    // app.use('', healthRoutes.env());
    // app.use('', healthRoutes.instance());
    // app.use('', healthRoutes.fiboRoutes());
  };
  routes();
};
