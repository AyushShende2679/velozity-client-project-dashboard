import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.listUserNotifications(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await NotificationService.markAsRead(id, req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await NotificationService.markAllAsRead(req.user!.id);
      res.status(200).json({
        success: true,
        data: result,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}
