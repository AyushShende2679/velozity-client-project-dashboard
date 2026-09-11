import { prisma } from '../config/db';
import { NotFoundError, ForbiddenError } from '../errors/AppError';
import { TokenPayload } from '../utils/jwt';
import { Role } from '@prisma/client';

export class ProjectService {
  static async listProjects(user: TokenPayload) {
    if (user.role === Role.ADMIN) {
      return prisma.project.findMany({
        include: {
          client: true,
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.PROJECT_MANAGER) {
      // PM can only see projects they created
      return prisma.project.findMany({
        where: { ownerId: user.id },
        include: {
          client: true,
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Developer: only projects that contain tasks assigned to this developer
    return prisma.project.findMany({
      where: {
        tasks: {
          some: {
            assignedToId: user.id,
          },
        },
      },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getProjectById(id: string, user: TokenPayload) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Role authorization check at service level
    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only view your own projects');
    }

    if (user.role === Role.DEVELOPER) {
      const hasAssignedTask = project.tasks.some(
        (task) => task.assignedToId === user.id
      );
      if (!hasAssignedTask) {
        throw new ForbiddenError('Access denied: You have no assigned tasks in this project');
      }

      // Developers must ONLY see their own tasks
      project.tasks = project.tasks.filter((t) => t.assignedToId === user.id);
    }

    return project;
  }

  static async createProject(
    data: { title: string; description?: string; clientId: string },
    user: TokenPayload
  ) {
    return prisma.project.create({
      data: {
        title: data.title,
        description: data.description,
        clientId: data.clientId,
        ownerId: user.id, // Project created by caller
      },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async updateProject(
    id: string,
    data: { title?: string; description?: string; clientId?: string },
    user: TokenPayload
  ) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only modify projects you created');
    }

    return prisma.project.update({
      where: { id },
      data,
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async deleteProject(id: string, user: TokenPayload) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only delete projects you created');
    }

    await prisma.project.delete({ where: { id } });
  }
}
