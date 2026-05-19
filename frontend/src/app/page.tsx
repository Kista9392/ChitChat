'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StoryBar from '@/components/StoryBar';
import PostCard from '@/components/PostCard';
import axiosInstance from '@/lib/axios';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-transparent">
      <Sidebar />
      <main className="pl-0 md:pl-20 xl:pl-64 pb-16 md:pb-0 min-h-screen bg-gradient-to-br from-rose-50/50 via-zinc-50 to-indigo-50/50 dark:bg-none">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex flex-col gap-6">
            
            <StoryBar />

            <div className="max-w-lg mx-auto w-full space-y-6">
              {isFetchingPosts ? (
                [1, 2].map((i) => (
                  <div key={i} className="aspect-square w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-pulse" />
                ))
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <p className="text-zinc-500 font-medium">No posts yet. Start following people!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
