import { prisma } from '../config/db';
import { NotFoundError, ForbiddenError, ValidationError } from '../errors/AppError';
import { TokenPayload } from '../utils/jwt';
import { Role, TaskStatus, TaskPriority, NotificationType, Prisma } from '@prisma/client';
import {
  broadcastTaskStatusUpdate,
  sendNotificationToUser,
} from '../websocket/socketServer';

export class TaskService {
  static async listTasks(
    filters: {
      status?: TaskStatus;
      priority?: TaskPriority;
      dueFrom?: string;
      dueTo?: string;
      from?: string;
      to?: string;
      projectId?: string;
      assignedToId?: string;
      search?: string;
    },
    user: TokenPayload
  ) {
    const where: Prisma.TaskWhereInput = {};

    // 1. Role Scoping
    if (user.role === Role.PROJECT_MANAGER) {
      where.project = { ownerId: user.id };
    } else if (user.role === Role.DEVELOPER) {
      where.assignedToId = user.id;
    }

    // 2. Query Filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.assignedToId && user.role !== Role.DEVELOPER) {
      where.assignedToId = filters.assignedToId;
    }

    const startDate = filters.from || filters.dueFrom;
    const endDate = filters.to || filters.dueTo;

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.dueDate.lte = new Date(endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // 3. Sorting: Developer tasks sorted by priority then due date
    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy:
        user.role === Role.DEVELOPER
          ? [{ dueDate: 'asc' }]
          : [{ createdAt: 'desc' }],
    });

    if (user.role === Role.DEVELOPER) {
      const priorityWeight: Record<TaskPriority, number> = {
        CRITICAL: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };
      return tasks.sort((a, b) => {
        const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (pDiff !== 0) return pDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }

    return tasks;
  }

  static async getTaskById(id: string, user: TokenPayload) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            client: { select: { id: true, name: true } },
          },
        },
        assignedTo: { select: { id: true, name: true, email: true } },
        activityLogs: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only view tasks from your own projects');
    }

    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw new ForbiddenError('You can only view tasks assigned to you');
    }

    return task;
  }

  static async createTask(
    projectId: string,
    data: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate: string;
      assignedToId?: string | null;
    },
    user: TokenPayload
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (user.role === Role.PROJECT_MANAGER && project.ownerId !== user.id) {
      throw new ForbiddenError('You can only create tasks in your own projects');
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || TaskPriority.MEDIUM,
        dueDate: new Date(data.dueDate),
        projectId,
        assignedToId: data.assignedToId || null,
        isOverdue: new Date(data.dueDate) < new Date(),
      },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Record initial creation activity
    await prisma.taskActivityLog.create({
      data: {
        taskId: task.id,
        projectId: task.projectId,
        userId: user.id,
        toStatus: TaskStatus.TO_DO,
        message: `${user.name} created Task #${task.taskNumber}: ${task.title}`,
      },
    });

    // If developer assigned, create in-app notification & emit WS event
    if (task.assignedToId) {
      const notification = await prisma.notification.create({
        data: {
          recipientId: task.assignedToId,
          title: 'New Task Assignment',
          message: `You have been assigned to Task #${task.taskNumber}: "${task.title}" in ${project.title}`,
          type: NotificationType.TASK_ASSIGNED,
          referenceId: task.id,
        },
      });

      const unreadCount = await prisma.notification.count({
        where: { recipientId: task.assignedToId, isRead: false },
      });

      sendNotificationToUser(task.assignedToId, notification, unreadCount);
    }

    return task;
  }

  static async updateTaskStatus(id: string, newStatus: TaskStatus, user: TokenPayload) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Role authorization check
    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only update tasks in your own projects');
    }

    if (user.role === Role.DEVELOPER && task.assignedToId !== user.id) {
      throw new ForbiddenError('You can only update tasks assigned to you');
    }

    if (task.status === newStatus) {
      return task;
    }

    const fromStatus = task.status;

    // Format human-readable status transition
    const formatStatusName = (s: TaskStatus) => {
      switch (s) {
        case TaskStatus.TO_DO:
          return 'To Do';
        case TaskStatus.IN_PROGRESS:
          return 'In Progress';
        case TaskStatus.IN_REVIEW:
          return 'In Review';
        case TaskStatus.DONE:
          return 'Done';
      }
    };

    const formattedMessage = `${user.name} moved Task #${task.taskNumber} from ${formatStatusName(
      fromStatus
    )} → ${formatStatusName(newStatus)}`;

    // Transactionally update task and persist activity log
    const [updatedTask, activityLog] = await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: {
          status: newStatus,
          isOverdue: newStatus === TaskStatus.DONE ? false : task.isOverdue,
        },
        include: {
          project: { select: { id: true, title: true, ownerId: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.taskActivityLog.create({
        data: {
          taskId: task.id,
          projectId: task.projectId,
          userId: user.id,
          fromStatus,
          toStatus: newStatus,
          message: formattedMessage,
        },
      }),
    ]);

    // Broadcast real-time status update via WebSockets
    broadcastTaskStatusUpdate({
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
      taskNumber: updatedTask.taskNumber,
      title: updatedTask.title,
      fromStatus,
      toStatus: newStatus,
      updatedBy: { id: user.id, name: user.name },
      message: formattedMessage,
      pmOwnerId: updatedTask.project.ownerId,
      assignedToId: updatedTask.assignedToId,
      createdAt: activityLog.createdAt.toISOString(),
    });

    // If moved to In Review, send notification to the project's PM
    if (newStatus === TaskStatus.IN_REVIEW) {
      const pmId = task.project.ownerId;
      const notification = await prisma.notification.create({
        data: {
          recipientId: pmId,
          title: 'Task Moved to In Review',
          message: `${user.name} moved Task #${task.taskNumber} to In Review in ${task.project.title}`,
          type: NotificationType.TASK_IN_REVIEW,
          referenceId: task.id,
        },
      });

      const unreadCount = await prisma.notification.count({
        where: { recipientId: pmId, isRead: false },
      });

      sendNotificationToUser(pmId, notification, unreadCount);
    }

    return updatedTask;
  }

  static async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      priority?: TaskPriority;
      dueDate?: string;
      assignedToId?: string | null;
      status?: TaskStatus;
    },
    user: TokenPayload
  ) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only edit tasks in your own projects');
    }

    const previousAssignedToId = task.assignedToId;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedToId: data.assignedToId,
        status: data.status,
      },
      include: {
        project: { select: { id: true, title: true, ownerId: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // If newly assigned or reassigned to a developer, notify the new developer
    if (
      data.assignedToId &&
      data.assignedToId !== previousAssignedToId
    ) {
      const notification = await prisma.notification.create({
        data: {
          recipientId: data.assignedToId,
          title: 'New Task Assignment',
          message: `You have been assigned to Task #${updatedTask.taskNumber}: "${updatedTask.title}" in ${task.project.title}`,
          type: NotificationType.TASK_ASSIGNED,
          referenceId: updatedTask.id,
        },
      });

      const unreadCount = await prisma.notification.count({
        where: { recipientId: data.assignedToId, isRead: false },
      });

      sendNotificationToUser(data.assignedToId, notification, unreadCount);
    }

    return updatedTask;
  }

  static async deleteTask(id: string, user: TokenPayload) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (user.role === Role.PROJECT_MANAGER && task.project.ownerId !== user.id) {
      throw new ForbiddenError('You can only delete tasks in your own projects');
    }

    await prisma.task.delete({ where: { id } });
  }
}
