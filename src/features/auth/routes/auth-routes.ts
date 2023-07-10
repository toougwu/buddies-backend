import { LoginController } from '@auth/controllers/login-controller';
import { LogoutController } from '@auth/controllers/logout-controller';
import { PasswordResetController } from '@auth/controllers/password-reset-controller';
import { RegisterController } from '@auth/controllers/register-controller';
import express, { Router } from 'express';

class AuthRoutes {
  private router: Router;

  constructor() {
    this.router = express.Router();
  }

  public routes(): Router {
    this.router.post('/register', RegisterController.prototype.createAccount);
    this.router.post('/login', LoginController.prototype.loginAccount);
    this.router.post('/forgot-password', PasswordResetController.prototype.sendResetLink);
    this.router.post('/reset-password/:token', PasswordResetController.prototype.updatePassword);

    return this.router;
  }

  public logoutRoute(): Router {
    this.router.get('/logout', LogoutController.prototype.logoutAccount);

    return this.router;
  }
}

export const authRoutes: AuthRoutes = new AuthRoutes();
