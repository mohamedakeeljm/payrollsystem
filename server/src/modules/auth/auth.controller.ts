import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const meta = {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
      };
      const result = await AuthService.login(email, password, meta);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      return next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);
      return sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuthService.logout(req.user.userId);
      }
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      return next(error);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await AuthService.getProfile(req.user!.userId);
      return sendSuccess(res, profile, 'User profile fetched successfully');
    } catch (error) {
      return next(error);
    }
  }
}
