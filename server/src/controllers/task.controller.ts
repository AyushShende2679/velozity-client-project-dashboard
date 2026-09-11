import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';

export class TaskController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const tasks = await TaskService.listTasks(req.query as any, req.user!);
      res.status(200).json({
        success: true,
        data: { tasks },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const task = await TaskService.getTaskById(id, req.user!);
      res.status(200).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.projectId as string;
      const task = await TaskService.createTask(
        projectId,
        req.body,
        req.user!
      );
      res.status(201).json({
        success: true,
        data: { task },
        message: 'Task created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const task = await TaskService.updateTaskStatus(
        id,
        req.body.status,
        req.user!
      );
      res.status(200).json({
        success: true,
        data: { task },
        message: 'Task status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const task = await TaskService.updateTask(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        data: { task },
        message: 'Task updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await TaskService.deleteTask(id, req.user!);
      res.status(200).json({
        success: true,
        data: null,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
