import { z } from 'zod';

export const createProjectSchema = {
  body: z.object({
    title: z.string().min(3, 'Project title must be at least 3 characters'),
    description: z.string().optional(),
    clientId: z.string().uuid('Valid client ID is required'),
  }),
};

export const updateProjectSchema = {
  params: z.object({
    id: z.string().uuid('Valid project ID required'),
  }),
  body: z.object({
    title: z.string().min(3, 'Project title must be at least 3 characters').optional(),
    description: z.string().optional(),
    clientId: z.string().uuid('Valid client ID is required').optional(),
  }),
};

export const getProjectSchema = {
  params: z.object({
    id: z.string().uuid('Valid project ID required'),
  }),
};
