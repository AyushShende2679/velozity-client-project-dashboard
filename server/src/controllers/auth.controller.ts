import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { setRefreshTokenCookie, clearRefreshTokenCookie } from '../utils/jwt';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.refreshToken;
      const { user, accessToken, refreshToken } = await AuthService.refresh(rawRefreshToken);

      setRefreshTokenCookie(res, refreshToken);

      res.status(200).json({
        success: true,
        data: {
          user,
          accessToken,
        },
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const rawRefreshToken = req.cookies?.refreshToken;
      await AuthService.logout(rawRefreshToken);

      clearRefreshTokenCookie(res);

      res.status(200).json({
        success: true,
        data: null,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getMe(req.user!.id);
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        data: { user },
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
