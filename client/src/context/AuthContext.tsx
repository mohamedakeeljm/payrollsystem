import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleCode } from '../types';
import { ApiClient } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: RoleCode[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('smarthr_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await ApiClient.get<any>('/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          localStorage.removeItem('smarthr_token');
        }
      } catch {
        localStorage.removeItem('smarthr_token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await ApiClient.post<any>('/auth/login', { email, password: pass });
    if (res.success && res.data) {
      localStorage.setItem('smarthr_token', res.data.tokens.accessToken);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await ApiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('smarthr_token');
      setUser(null);
      window.location.href = '/';
    }
  };

  const hasRole = (...roles: RoleCode[]): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return roles.includes(user.role);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
