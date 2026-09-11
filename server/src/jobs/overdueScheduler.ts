import cron from 'node-cron';
import { prisma } from '../config/db';
import { TaskStatus } from '@prisma/client';

export async function checkOverdueTasksNow(): Promise<number> {
  const now = new Date();
  try {
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: TaskStatus.DONE },
        isOverdue: false,
      },
      select: {
        id: true,
        title: true,
        taskNumber: true,
        projectId: true,
      },
    });

    if (overdueTasks.length === 0) {
      return 0;
    }

    const taskIds = overdueTasks.map((t) => t.id);

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: { isOverdue: true },
    });

    console.log(
      `[CRON_OVERDUE_SCHEDULER] ${now.toISOString()}: Flagged ${result.count} tasks as overdue.`,
      overdueTasks.map((t) => `#${t.taskNumber} (${t.title})`)
    );

    return result.count;
  } catch (error) {
    console.error('[CRON_OVERDUE_SCHEDULER_ERROR]', error);
    return 0;
  }
}

export function initOverdueScheduler() {
  // Run once on server startup
  checkOverdueTasksNow();

  // Schedule to run every minute
  const task = cron.schedule('* * * * *', async () => {
    await checkOverdueTasksNow();
  });

  console.log('[CRON] Overdue task scheduler initialized (running every 60 seconds).');
  return task;
}
