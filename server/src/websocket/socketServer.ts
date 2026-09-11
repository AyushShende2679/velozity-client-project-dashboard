import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { Role } from '@prisma/client';
import { ENV } from '../config/env';

export interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

let ioInstance: SocketIOServer | null = null;
const onlineUsers = new Map<string, number>(); // userId -> count of active sockets

export function initWebSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH'],
    },
    transports: ['websocket'],
  });

  // Authentication Middleware for Handshake
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return;

    // Track online user presence
    const currentCount = onlineUsers.get(user.id) || 0;
    onlineUsers.set(user.id, currentCount + 1);

    // Join role-specific and user-specific rooms
    if (user.role === Role.ADMIN) {
      socket.join('global-admin');
    } else if (user.role === Role.PROJECT_MANAGER) {
      socket.join(`pm-${user.id}`);
    } else if (user.role === Role.DEVELOPER) {
      socket.join(`dev-${user.id}`);
    }

    // Always join individual user room for direct notifications
    socket.join(`user-${user.id}`);

    // Broadcast updated presence count to admins
    broadcastPresenceCount(io);

    // Dynamic project room subscription
    socket.on('project:join', (projectId: string) => {
      if (projectId && typeof projectId === 'string') {
        socket.join(`project-${projectId}`);
      }
    });

    socket.on('project:leave', (projectId: string) => {
      if (projectId && typeof projectId === 'string') {
        socket.leave(`project-${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      const count = onlineUsers.get(user.id) || 1;
      if (count <= 1) {
        onlineUsers.delete(user.id);
      } else {
        onlineUsers.set(user.id, count - 1);
      }
      broadcastPresenceCount(io);
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function getOnlineUsersCount(): number {
  return onlineUsers.size;
}

function broadcastPresenceCount(io: SocketIOServer) {
  const count = onlineUsers.size;
  io.to('global-admin').emit('presence:update', { onlineUserCount: count });
}

export function broadcastTaskStatusUpdate(payload: {
  taskId: string;
  projectId: string;
  taskNumber: number;
  title: string;
  fromStatus: string | null;
  toStatus: string;
  updatedBy: { id: string; name: string };
  message: string;
  pmOwnerId: string;
  assignedToId?: string | null;
  createdAt: string;
}) {
  if (!ioInstance) return;

  // 1. All users currently viewing this project
  ioInstance.to(`project-${payload.projectId}`).emit('task:status_updated', payload);

  // 2. Admin global activity feed
  ioInstance.to('global-admin').emit('activity:new', payload);

  // 3. Project Manager's activity feed
  ioInstance.to(`pm-${payload.pmOwnerId}`).emit('activity:new', payload);

  // 4. Assigned Developer's activity feed (if assigned)
  if (payload.assignedToId) {
    ioInstance.to(`dev-${payload.assignedToId}`).emit('activity:new', payload);
  }
}

export function sendNotificationToUser(
  userId: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    referenceId?: string | null;
    isRead: boolean;
    createdAt: Date;
  },
  unreadCount: number
) {
  if (!ioInstance) return;

  ioInstance.to(`user-${userId}`).emit('notification:new', {
    notification,
    unreadCount,
  });
}
