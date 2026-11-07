import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { api, ApiError } from '../lib/api';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('afframe_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('afframe_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const hasToken = !!localStorage.getItem('afframe_admin_token');
    const hasUser = !!localStorage.getItem('afframe_admin_user');
    // If token exists and we already have cached user, ready immediately!
    return hasToken && !hasUser;
  });

  useEffect(() => {
    let isMounted = true;

    async function verifyUser() {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.get<{ user: AdminUser }>('/auth/me');
        if (isMounted) {
          setUser(res.user);
          try {
            localStorage.setItem('afframe_admin_user', JSON.stringify(res.user));
          } catch {}
        }
      } catch (err: any) {
        console.warn('Session verification notice:', err);
        // Only invalidate on explicit 401/403 auth rejection
        const isAuthError = err?.status === 401 || err?.statusCode === 401 || err?.status === 403;
        if (isAuthError) {
          localStorage.removeItem('afframe_admin_token');
          localStorage.removeItem('afframe_admin_user');
          if (isMounted) {
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyUser();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AdminUser }>('/auth/login', { email, password });
    localStorage.setItem('afframe_admin_token', res.token);
    try {
      localStorage.setItem('afframe_admin_user', JSON.stringify(res.user));
    } catch {}
    setToken(res.token);
    setUser(res.user);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('afframe_admin_token');
    localStorage.removeItem('afframe_admin_user');
    setToken(null);
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        changePassword,
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
