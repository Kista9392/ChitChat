'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { safeStorage } from '@/lib/storage';

interface User {
  username: string;
  email?: string;
  showActivityStatus?: boolean;
  avatarUrl?: string;
  pushNotificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  isPrivateAccount?: boolean;
  bio?: string;
  createdAt?: string;
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
    const token = safeStorage.getItem('accessToken');
    const username = safeStorage.getItem('username');
    const avatarUrl = safeStorage.getItem('avatarUrl');
    
    if (token && username) {
      if (!avatarUrl) {
        setUser({ username });
        axiosInstance.get(`/users/${username}`)
          .then(res => {
            const fetchedAvatar = res.data.avatarUrl;
            if (fetchedAvatar) {
              safeStorage.setItem('avatarUrl', fetchedAvatar);
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
  // Register service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker registered successfully:', reg.scope))
          .catch(err => console.error('Service Worker registration failed:', err));
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        return () => window.removeEventListener('load', registerSW);
      }
    }
  }, []);
  // Capture beforeinstallprompt globally to persist across page navigations
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-installable', { detail: e }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);


  useEffect(() => {
    const isDark = safeStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Periodic online status heartbeat
  useEffect(() => {
    if (!user?.username) return;
    
    const ping = () => {
      axiosInstance.post('/users/me/ping').catch(() => {});
    };
    
    ping();
    
    const interval = setInterval(ping, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    safeStorage.setItem('darkMode', newDark.toString());
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const login = (accessToken: string, refreshToken: string, username: string, avatarUrl?: string) => {
    safeStorage.setItem('accessToken', accessToken);
    safeStorage.setItem('refreshToken', refreshToken);
    safeStorage.setItem('username', username);
    if (avatarUrl) safeStorage.setItem('avatarUrl', avatarUrl);
    setUser({ username, avatarUrl });
    router.push('/');
  };

  const logout = () => {
    safeStorage.clear();
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
