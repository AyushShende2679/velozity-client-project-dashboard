import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';

export class ProjectController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await ProjectService.listProjects(req.user!);
      res.status(200).json({
        success: true,
        data: { projects },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const project = await ProjectService.getProjectById(id, req.user!);
      res.status(200).json({
        success: true,
        data: { project },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.createProject(req.body, req.user!);
      res.status(201).json({
        success: true,
        data: { project },
        message: 'Project created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const project = await ProjectService.updateProject(id, req.body, req.user!);
      res.status(200).json({
        success: true,
        data: { project },
        message: 'Project updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await ProjectService.deleteProject(id, req.user!);
      res.status(200).json({
        success: true,
        data: null,
        message: 'Project deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
