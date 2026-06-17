'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ApiResponse } from '@/lib/api';
import { AdminRole } from '@avitus/shared-types';

interface AdminUser {
  sub: string;
  username: string;
  role: AdminRole;
}

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedAdmin = localStorage.getItem('admin');
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await api.post<
      ApiResponse<{ token: string; admin: { _id: string; username: string; role: AdminRole } }>
    >('/auth/login', { username, password });

    const adminUser: AdminUser = {
      sub: data.data.admin._id,
      username: data.data.admin.username,
      role: data.data.admin.role,
    };

    localStorage.setItem('token', data.data.token);
    localStorage.setItem('admin', JSON.stringify(adminUser));
    setToken(data.data.token);
    setAdmin(adminUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setToken(null);
    setAdmin(null);
    window.location.href = '/login/';
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
