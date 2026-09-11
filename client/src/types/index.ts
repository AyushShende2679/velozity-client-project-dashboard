export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
}

export interface Project {
  id: string;
  title: string;
  description?: string | null;
  clientId: string;
  client?: Client;
  ownerId: string;
  owner?: { id: string; name: string; email: string };
  tasks?: Task[];
  _count?: { tasks: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  isOverdue: boolean;
  dueDate: string;
  projectId: string;
  project?: { id: string; title: string; ownerId: string; client?: Client };
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivityLog {
  id: string;
  taskId: string;
  task?: { id: string; taskNumber: number; title: string };
  projectId: string;
  project?: { id: string; title: string };
  userId: string;
  user?: { id: string; name: string; email?: string };
  fromStatus?: TaskStatus | null;
  toStatus: TaskStatus;
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'TASK_ASSIGNED' | 'TASK_IN_REVIEW';
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminMetrics {
  role: 'ADMIN';
  totalProjects: number;
  totalTasks: number;
  overdueCount: number;
  onlineUserCount: number;
  tasksByStatus: {
    TO_DO: number;
    IN_PROGRESS: number;
    IN_REVIEW: number;
    DONE: number;
  };
}

export interface PMMetrics {
  role: 'PROJECT_MANAGER';
  totalProjects: number;
  projects: Project[];
  dueThisWeekCount: number;
  overdueCount: number;
  tasksByPriority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
}

export interface DeveloperMetrics {
  role: 'DEVELOPER';
  assignedCount: number;
  dueThisWeekCount: number;
  overdueCount: number;
}
