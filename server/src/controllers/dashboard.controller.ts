import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await DashboardService.getMetrics(req.user!);
      res.status(200).json({
        success: true,
        data: { metrics },
      });
    } catch (error) {
      next(error);
    }
  }
}
