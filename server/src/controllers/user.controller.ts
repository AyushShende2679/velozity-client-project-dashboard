import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { Role } from '@prisma/client';

export class UserController {
  static async listDevelopers(req: Request, res: Response, next: NextFunction) {
    try {
      const developers = await prisma.user.findMany({
        where: { role: Role.DEVELOPER },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: { developers },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }
}
