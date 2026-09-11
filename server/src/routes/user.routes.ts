import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get(
  '/developers',
  authorizeRoles(Role.ADMIN, Role.PROJECT_MANAGER),
  UserController.listDevelopers
);

router.get(
  '/',
  authorizeRoles(Role.ADMIN),
  UserController.listAllUsers
);

export default router;
