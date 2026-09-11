import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
} from '../validators/project.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', ProjectController.list);

router.get('/:id', validate(getProjectSchema), ProjectController.getById);

router.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createProjectSchema),
  ProjectController.create
);

router.patch(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(updateProjectSchema),
  ProjectController.update
);

router.delete(
  '/:id',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(getProjectSchema),
  ProjectController.delete
);

export default router;
