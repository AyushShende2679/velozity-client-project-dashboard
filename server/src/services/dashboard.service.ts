import { prisma } from '../config/db';
import { TokenPayload } from '../utils/jwt';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';
import { getOnlineUsersCount } from '../websocket/socketServer';

export class DashboardService {
  static async getMetrics(user: TokenPayload) {
    const now = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    if (user.role === Role.ADMIN) {
      const [
        totalProjects,
        totalTasks,
        overdueCount,
        toDoCount,
        inProgressCount,
        inReviewCount,
        doneCount,
      ] = await Promise.all([
        prisma.project.count(),
        prisma.task.count(),
        prisma.task.count({ where: { isOverdue: true } }),
        prisma.task.count({ where: { status: TaskStatus.TO_DO } }),
        prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
        prisma.task.count({ where: { status: TaskStatus.IN_REVIEW } }),
        prisma.task.count({ where: { status: TaskStatus.DONE } }),
      ]);

      return {
        role: Role.ADMIN,
        totalProjects,
        totalTasks,
        overdueCount,
        onlineUserCount: getOnlineUsersCount(),
        tasksByStatus: {
          TO_DO: toDoCount,
          IN_PROGRESS: inProgressCount,
          IN_REVIEW: inReviewCount,
          DONE: doneCount,
        },
      };
    }

    if (user.role === Role.PROJECT_MANAGER) {
      const [
        ownedProjects,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        dueThisWeekCount,
        overdueCount,
      ] = await Promise.all([
        prisma.project.findMany({
          where: { ownerId: user.id },
          include: {
            client: true,
            _count: { select: { tasks: true } },
          },
        }),
        prisma.task.count({
          where: { project: { ownerId: user.id }, priority: TaskPriority.CRITICAL },
        }),
        prisma.task.count({
          where: { project: { ownerId: user.id }, priority: TaskPriority.HIGH },
        }),
        prisma.task.count({
          where: { project: { ownerId: user.id }, priority: TaskPriority.MEDIUM },
        }),
        prisma.task.count({
          where: { project: { ownerId: user.id }, priority: TaskPriority.LOW },
        }),
        prisma.task.count({
          where: {
            project: { ownerId: user.id },
            dueDate: { gte: now, lte: endOfWeek },
            status: { not: TaskStatus.DONE },
          },
        }),
        prisma.task.count({
          where: {
            project: { ownerId: user.id },
            isOverdue: true,
          },
        }),
      ]);

      return {
        role: Role.PROJECT_MANAGER,
        totalProjects: ownedProjects.length,
        projects: ownedProjects,
        dueThisWeekCount,
        overdueCount,
        tasksByPriority: {
          CRITICAL: criticalCount,
          HIGH: highCount,
          MEDIUM: mediumCount,
          LOW: lowCount,
        },
      };
    }

    // Role.DEVELOPER
    const [assignedCount, dueThisWeekCount, overdueCount] = await Promise.all([
      prisma.task.count({ where: { assignedToId: user.id } }),
      prisma.task.count({
        where: {
          assignedToId: user.id,
          dueDate: { gte: now, lte: endOfWeek },
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.task.count({
        where: {
          assignedToId: user.id,
          isOverdue: true,
        },
      }),
    ]);

    return {
      role: Role.DEVELOPER,
      assignedCount,
      dueThisWeekCount,
      overdueCount,
    };
  }
}
