'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, Search, Compass, Film, MessageCircle, Heart, 
  PlusSquare, User, Camera, Menu, Settings, Sun, Moon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { icon: Home, label: 'Home', href: '/', color: 'text-indigo-500' },
  { icon: Search, label: 'Search', href: '/search', color: 'text-rose-500' },
  { icon: Compass, label: 'Explore', href: '/explore', color: 'text-emerald-500' },
  { icon: Film, label: 'Reels', href: '/reels', color: 'text-violet-500' },
  { icon: MessageCircle, label: 'Messages', href: '/messages', color: 'text-amber-500' },
  { icon: Heart, label: 'Notifications', href: '/notifications', color: 'text-red-500' },
  { icon: PlusSquare, label: 'Create', href: '/create', color: 'text-sky-500' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();




  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-screen w-20 xl:w-64 border-r border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex-col p-3 transition-all duration-300 z-50 overflow-y-auto">
        {/* Logo */}
        <Link href="/" className="mb-6 px-3 flex items-center gap-4 text-black dark:text-white pt-2">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200/50 shrink-0">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="hidden xl:block font-black text-2xl tracking-tighter italic bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text">ChitChat</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-4 p-2.5 rounded-2xl transition-all duration-300 group hover:bg-white/50 dark:hover:bg-zinc-800/50",
                  isActive ? "bg-indigo-50/70 dark:bg-indigo-900/30 font-bold text-indigo-600 dark:text-indigo-400" : "text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6 transition-all duration-300 shrink-0",
                  isActive ? "scale-110" : "opacity-70 group-hover:opacity-100 group-hover:scale-110",
                  item.color
                )} />
                <span className="hidden xl:block text-base tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* Profile */}
          <Link
            href={`/${user?.username || 'profile'}`}
            title="Profile"
            className={cn(
              "flex items-center gap-4 p-2.5 rounded-2xl transition-all duration-300 group hover:bg-white/50 dark:hover:bg-zinc-800/50",
              pathname === `/${user?.username}` 
                ? "bg-indigo-50/70 dark:bg-indigo-900/30 font-bold text-indigo-600 dark:text-indigo-400" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px] group-hover:scale-110 transition-transform shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-black dark:text-white" />
                )}
              </div>
            </div>
            <span className="hidden xl:block text-base tracking-tight">Profile</span>
          </Link>
        </nav>

        {/* Footer / More */}
        <div className="mt-auto space-y-1 pt-3 border-t border-zinc-100 dark:border-zinc-800">

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-4 p-2.5 rounded-2xl transition-all duration-300 group hover:bg-white/50 dark:hover:bg-zinc-800/50",
              pathname === '/settings' 
                ? "bg-indigo-50/70 dark:bg-indigo-900/30 font-bold text-indigo-600 dark:text-indigo-400" 
                : "text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400"
            )}
          >
            <Settings className={cn(
              "w-6 h-6 transition-all duration-300 shrink-0",
              pathname === '/settings' ? "scale-110 text-indigo-600 dark:text-indigo-400" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"
            )} />
            <span className="hidden xl:block text-base tracking-tight">Settings</span>
          </Link>
        </div>
      </div>

      {/* Mobile Floating Glassmorphic Dock */}
      <div className="md:hidden fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-2 min-[360px]:left-4 right-2 min-[360px]:right-4 h-16 glass-dock rounded-full flex items-center justify-around px-2 min-[360px]:px-3 z-50 shadow-2xl transition-all duration-300">
        {navItems.filter(item => ['Home', 'Search', 'Reels', 'Messages'].includes(item.label)).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className="relative p-2.5 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
            >
              <item.icon className={cn(
                "w-6 h-6 transition-all duration-300",
                isActive ? "scale-115 stroke-[2.5px]" : "opacity-60",
                item.color
              )} />
              {isActive && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-current rounded-full animate-pulse opacity-85" style={{ color: 'inherit' }} />
              )}
            </Link>
          );
        })}
        
        {/* Profile on mobile */}
        <Link
          href={`/${user?.username || 'profile'}`}
          title="Profile"
          className="relative p-2.5 rounded-full transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
        >
          <div className={cn(
            "w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px] transition-all duration-300",
            pathname === `/${user?.username}` ? "scale-115 ring-2 ring-indigo-500/30" : "opacity-80"
          )}>
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-black dark:text-white" />
              )}
            </div>
          </div>
          {pathname === `/${user?.username}` && (
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          )}
        </Link>
      </div>
    </>
  );
}
