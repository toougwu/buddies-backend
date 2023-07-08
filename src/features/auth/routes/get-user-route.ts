import { CurrentUser } from '@auth/controllers/current-user-controller';
import { authMiddleware } from '@globals/middlewares/auth-middleware';
import express, { Router } from 'express';

class GetUserRoute {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.get('/current-user', authMiddleware.checkAuthentication, CurrentUser.prototype.getUser);

    return this.router;
  }
}

export const getUserRoute: GetUserRoute = new GetUserRoute();
