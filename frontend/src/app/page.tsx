'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StoryBar from '@/components/StoryBar';
import PostCard from '@/components/PostCard';
import axiosInstance from '@/lib/axios';
import { PlusSquare, Heart } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [isFetchingPosts, setIsFetchingPosts] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get('/posts');
      setPosts(response.data.content || []);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setIsFetchingPosts(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    window.addEventListener('focus', fetchPosts);
    return () => window.removeEventListener('focus', fetchPosts);
  }, [fetchPosts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-transparent select-none">
      <Sidebar />
      
      {/* Mobile Sticky Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 pt-[env(safe-area-inset-top,0px)] h-[calc(3.5rem+env(safe-area-inset-top,0px))] glass-dock border-b border-zinc-100/50 dark:border-zinc-800/50 flex items-center justify-between px-4 z-40 shadow-sm">
        <Link href="/create" className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 transition-colors duration-200" title="Create Post">
          <PlusSquare className="w-6 h-6" />
        </Link>
        <span className="font-black text-xl tracking-tighter italic bg-gradient-to-r from-rose-500 to-indigo-600 text-transparent bg-clip-text">ChitChat</span>
        <Link href="/notifications" className="p-2 text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 transition-colors duration-200" title="Notifications">
          <Heart className="w-6 h-6" />
        </Link>
      </div>

      <main className="pl-0 md:pl-20 xl:pl-64 pt-[calc(4rem+env(safe-area-inset-top,0px))] md:pt-0 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-8 min-h-screen bg-transparent transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 py-6 md:p-8">
          <div className="flex flex-col gap-6">
            
            <StoryBar />

            <div className="max-w-lg mx-auto w-full space-y-6">
              {isFetchingPosts ? (
                [1, 2].map((i) => (
                  <div key={i} className="aspect-square w-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/20 dark:border-zinc-800/40 animate-pulse" />
                ))
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-20 glass-container rounded-3xl shadow-sm">
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">No posts yet. Start following people!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
