import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const createTaskSchema = {
  params: z.object({
    projectId: z.string().uuid('Valid project ID required'),
  }),
  body: z.object({
    title: z.string().min(3, 'Task title must be at least 3 characters'),
    description: z.string().optional(),
    priority: z.nativeEnum(TaskPriority).optional().default(TaskPriority.MEDIUM),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Valid ISO date required for dueDate',
    }),
    assignedToId: z.string().uuid('Valid developer ID required').optional().nullable(),
  }),
};

export const updateTaskStatusSchema = {
  params: z.object({
    id: z.string().uuid('Valid task ID required'),
  }),
  body: z.object({
    status: z.nativeEnum(TaskStatus),
  }),
};

export const updateTaskSchema = {
  params: z.object({
    id: z.string().uuid('Valid task ID required'),
  }),
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional().nullable(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Valid ISO date required for dueDate',
      })
      .optional(),
    assignedToId: z.string().uuid().optional().nullable(),
    status: z.nativeEnum(TaskStatus).optional(),
  }),
};

export const taskQuerySchema = {
  query: z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    dueFrom: z.string().optional(),
    dueTo: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    projectId: z.string().uuid().optional(),
    assignedToId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
};
