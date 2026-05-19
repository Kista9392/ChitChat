'use client';

import React, { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { Heart, MessageSquare, UserPlus, Bell, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    if (!user?.username) return;

    // Fetch existing notifications
    axiosInstance.get('/notifications')
      .then(res => {
        // Backend may return a Page object or a plain array
        const data = res.data;
        if (Array.isArray(data)) setNotifications(data);
        else if (data?.content) setNotifications(data.content);
        else setNotifications([]);
      })
      .catch(err => console.error('Failed to fetch notifications', err))
      .finally(() => setIsLoading(false));

    // Connect WebSocket for real-time notifications
    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${user.username}`, (frame) => {
          try {
            const body = JSON.parse(frame.body);
            setNotifications(prev => [body, ...prev]);
          } catch (e) {
            console.error('Failed to parse notification', e);
          }
        });
      },
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    };
  }, [user?.username]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Heart className="w-5 h-5 text-red-500 fill-red-500" />;
      case 'COMMENT': return <MessageSquare className="w-5 h-5 text-indigo-500" />;
      case 'FOLLOW': return <UserPlus className="w-5 h-5 text-emerald-500" />;
      case 'MESSAGE': return <MessageCircle className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'LIKE': return 'bg-red-50';
      case 'COMMENT': return 'bg-indigo-50';
      case 'FOLLOW': return 'bg-emerald-50';
      case 'MESSAGE': return 'bg-amber-50';
      default: return 'bg-zinc-50';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="pl-20 xl:pl-64 min-h-screen bg-zinc-50/30">
        <div className="max-w-2xl mx-auto p-6 md:p-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-black">Notifications</h1>
            {notifications.some(n => !n.read) && (
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 animate-pulse">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-100 rounded w-3/4" />
                    <div className="h-2 bg-zinc-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <AnimatePresence>
              <div className="space-y-2">
                {notifications.map((n, i) => (
                  <motion.div
                    key={n.id || i}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-2xl border transition-colors',
                      n.read
                        ? 'bg-white border-zinc-100 hover:border-zinc-200'
                        : 'bg-indigo-50/30 border-indigo-100 hover:border-indigo-200'
                    )}
                  >
                    {/* Icon */}
                    <div className={cn('w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0', getIconBg(n.type))}>
                      {getIcon(n.type)}
                    </div>

                    {/* Sender avatar + content */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {n.senderUsername?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black leading-snug">
                        <Link href={`/${n.senderUsername}`} className="font-bold hover:underline">{n.senderUsername}</Link>
                        {' '}{n.content?.replace(n.senderUsername, '').trim()}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{formatTime(n.createdAt)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.read && <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0" />}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-zinc-100">
              <Bell className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <p className="font-bold text-zinc-800 text-lg">All caught up!</p>
              <p className="text-zinc-400 text-sm mt-1">You have no notifications yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
