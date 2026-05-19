'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';

interface User {
  username: string;
  email?: string;
  showActivityStatus?: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (accessToken: string, refreshToken: string, username: string, avatarUrl?: string) => void;
  logout: () => void;
  isLoading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const username = localStorage.getItem('username');
    const avatarUrl = localStorage.getItem('avatarUrl');
    
    if (token && username) {
      if (!avatarUrl) {
        setUser({ username });
        axiosInstance.get(`/users/${username}`)
          .then(res => {
            const fetchedAvatar = res.data.avatarUrl;
            if (fetchedAvatar) {
              localStorage.setItem('avatarUrl', fetchedAvatar);
              setUser({ username, avatarUrl: fetchedAvatar });
            }
          })
          .catch(err => console.error('Failed to fetch user profile on load', err))
          .finally(() => setIsLoading(false));
      } else {
        setUser({ username, avatarUrl });
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    localStorage.setItem('darkMode', newDark.toString());
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = (accessToken: string, refreshToken: string, username: string, avatarUrl?: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('username', username);
    if (avatarUrl) localStorage.setItem('avatarUrl', avatarUrl);
    setUser({ username, avatarUrl });
    router.push('/');
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
