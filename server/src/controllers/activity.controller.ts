import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';

export class ActivityController {
  static async getMissed(req: Request, res: Response, next: NextFunction) {
    try {
      const lastSeen = req.query.lastSeen as string | undefined;
      const activities = await ActivityService.getMissedActivities(req.user!, lastSeen);
      res.status(200).json({
        success: true,
        data: { activities },
      });
    } catch (error) {
      next(error);
    }
  }
}
