import { CurrentUserController } from '@auth/controllers/current-user-controller';
import { authMiddleware } from '@globals/middlewares/auth-middleware';
import express, { Router } from 'express';

class GetUserRoute {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/current-user', authMiddleware.checkAuthentication, CurrentUserController.prototype.getUser);

    return this.router;
  }
}

export const getUserRoute: GetUserRoute = new GetUserRoute();
