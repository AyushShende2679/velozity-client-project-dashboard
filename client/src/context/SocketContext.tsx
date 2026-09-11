import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { TaskActivityLog, Notification } from '../types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserCount: number;
  liveActivities: TaskActivityLog[];
  unreadNotificationsCount: number;
  latestNotification: Notification | null;
  joinProjectRoom: (projectId: string) => void;
  leaveProjectRoom: (projectId: string) => void;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  setLiveActivities: React.Dispatch<React.SetStateAction<TaskActivityLog[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserCount, setOnlineUserCount] = useState(0);
  const [liveActivities, setLiveActivities] = useState<TaskActivityLog[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  useEffect(() => {
    if (!accessToken || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    // Admin online user presence updates
    s.on('presence:update', (data: { onlineUserCount: number }) => {
      setOnlineUserCount(data.onlineUserCount);
    });

    // Real-time live activity feed push
    s.on('activity:new', (activity: any) => {
      setLiveActivities((prev) => [activity, ...prev.slice(0, 49)]);
    });

    // Real-time notification push
    s.on(
      'notification:new',
      (payload: { notification: Notification; unreadCount: number }) => {
        setLatestNotification(payload.notification);
        setUnreadNotificationsCount(payload.unreadCount);
      }
    );

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [accessToken, user]);

  const joinProjectRoom = (projectId: string) => {
    if (socket && socket.connected) {
      socket.emit('project:join', projectId);
    }
  };

  const leaveProjectRoom = (projectId: string) => {
    if (socket && socket.connected) {
      socket.emit('project:leave', projectId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserCount,
        liveActivities,
        unreadNotificationsCount,
        latestNotification,
        joinProjectRoom,
        leaveProjectRoom,
        setUnreadNotificationsCount,
        setLiveActivities,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
