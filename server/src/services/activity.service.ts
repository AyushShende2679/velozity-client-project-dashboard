import { prisma } from '../config/db';
import { TokenPayload } from '../utils/jwt';
import { Role, Prisma } from '@prisma/client';

export class ActivityService {
  static async getMissedActivities(user: TokenPayload, lastSeen?: string) {
    const where: Prisma.TaskActivityLogWhereInput = {};

    // 1. Role-based scoping
    if (user.role === Role.PROJECT_MANAGER) {
      where.project = { ownerId: user.id };
    } else if (user.role === Role.DEVELOPER) {
      where.task = { assignedToId: user.id };
    }

    // 2. Offline timestamp filter (if provided, fetch events after this timestamp; otherwise last 20)
    if (lastSeen) {
      const parsedDate = new Date(lastSeen);
      if (!isNaN(parsedDate.getTime())) {
        where.createdAt = { gt: parsedDate };
      }
    }

    // Fetch recent events directly from database for catchup
    const activities = await prisma.taskActivityLog.findMany({
      where,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, taskNumber: true, title: true } },
        project: { select: { id: true, title: true } },
      },
    });

    return activities;
  }
}
