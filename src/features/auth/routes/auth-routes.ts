import { Login } from '@auth/controllers/login-controller';
import { Logout } from '@auth/controllers/logout-controller';
import { Register } from '@auth/controllers/register-controller';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/register', Register.prototype.createAccount);
    this.router.post('/login', Login.prototype.loginAccount);
    // this.router.post('/forgot-password', Password.prototype.create);
    // this.router.post('/reset-password/:token', Password.prototype.update);

    return this.router;
  }

  public logoutRoute(): Router {
    this.router.get('/logout', Logout.prototype.logoutAccount);

    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
