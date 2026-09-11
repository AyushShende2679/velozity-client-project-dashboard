import { Router } from 'express';
import { ClientController } from '../controllers/client.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createClientSchema } from '../validators/client.validator';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  ClientController.list
);

router.post(
  '/',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  validate(createClientSchema),
  ClientController.create
);

export default router;
