import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setAccessToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Silent session rehydration on initial mount using HttpOnly refresh cookie
  useEffect(() => {
    async function rehydrateSession() {
      try {
        const res = await api.post('/auth/refresh');
        if (res.data?.success && res.data?.data) {
          const { user, accessToken } = res.data.data;
          setUser(user);
          setAccessTokenState(accessToken);
          setAccessToken(accessToken);
        }
      } catch {
        setUser(null);
        setAccessTokenState(null);
        setAccessToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    rehydrateSession();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessTokenState(null);
      setAccessToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data?.data) {
      const { user, accessToken } = res.data.data;
      setUser(user);
      setAccessTokenState(accessToken);
      setAccessToken(accessToken);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessTokenState(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
