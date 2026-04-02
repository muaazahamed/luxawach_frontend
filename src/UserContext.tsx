import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from './types';
import api from './api';
import { toast } from 'sonner';
import { AUTH_TOKEN_KEY, clearAuthStorage, getStoredToken, getTokenRole, isTokenValid } from './authToken';

interface UserContextType {
  user: UserProfile & { token?: string } | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<(UserProfile & { token?: string }) | null>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  applySession: (payload: {
    token: string;
    role: string;
    userId: string;
    name?: string;
    email?: string;
  }) => void;
  logout: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile & { token?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = (payload: {
    token: string;
    role: string;
    userId: string;
    name?: string;
    email?: string;
  }) => {
    const nextUser = {
      uid: payload.userId,
      email: payload.email || '',
      displayName: payload.name || 'User',
      role: payload.role as any,
      token: payload.token,
      createdAt: Date.now(),
    };
    setUser(nextUser);
    localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    localStorage.setItem('userInfo', JSON.stringify(nextUser));
  };

  useEffect(() => {
    if (!isTokenValid()) {
      clearAuthStorage();
      setUser(null);
      setLoading(false);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let storedUser: any = null;
    try {
      storedUser = JSON.parse(localStorage.getItem('userInfo') || 'null');
    } catch {
      storedUser = null;
    }

    const tokenRole = getTokenRole();
    const restoredUser = {
      uid: String(storedUser?.uid || ''),
      email: String(storedUser?.email || ''),
      displayName: String(storedUser?.displayName || 'User'),
      role: (tokenRole === 'admin' ? 'admin' : 'user') as UserProfile['role'],
      token,
      createdAt: Number(storedUser?.createdAt || Date.now()),
    };

    setUser(restoredUser);
    localStorage.setItem('userInfo', JSON.stringify(restoredUser));
    setLoading(false);
  }, []);

  const login = async (email: string, password = '') => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      const loggedInUser = {
        uid: data.userId || data._id,
        email: data.email,
        displayName: data.name,
        role: data.role,
        token: data.token,
        createdAt: Date.now()
      };

      applySession({
        token: data.token,
        role: data.role,
        userId: data.userId || data._id,
        name: data.name,
        email: data.email,
      });
      toast.success('Successfully logged in');
      return loggedInUser;
    } catch (error: any) {
      console.error("Login failed:", error);
      clearAuthStorage();
      setUser(null);
      toast.error(error.response?.data?.message || 'Login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password });
      toast.success('Account created successfully');
      return true;
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      setUser(null);
      clearAuthStorage();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId: string) => {
    if (!user) return;
    toast.info('Wishlist sync disabled in preview version');
  };

  return (
    <UserContext.Provider value={{ user, loading, login, register, applySession, logout, toggleWishlist }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
