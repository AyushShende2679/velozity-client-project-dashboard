import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createTaskSchema,
  updateTaskStatusSchema,
  updateTaskSchema,
  taskQuerySchema,
} from '../validators/task.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// List tasks with URL query parameter filters
router.get('/', validate(taskQuerySchema), TaskController.list);

// Get task detail
router.get('/:id', TaskController.getById);

// Create task in a project
router.post(
  '/project/:projectId',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createTaskSchema),
  TaskController.create
);

// Update status (Accessible by Admin, Project Owner PM, and Assigned Developer)
router.patch(
  '/:id/status',
  validate(updateTaskStatusSchema),
  TaskController.updateStatus
);

// Update task metadata (Admin & PM only)
router.patch(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(updateTaskSchema),
  TaskController.update
);

// Delete task (Admin & PM only)
router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  TaskController.delete
);

export default router;
