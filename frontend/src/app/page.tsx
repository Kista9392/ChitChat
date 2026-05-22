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
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(true);

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

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axiosInstance.get('/users/suggestions');
      setSuggestions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchSuggestions();
  }, [fetchPosts, fetchSuggestions]);

  useEffect(() => {
    window.addEventListener('focus', fetchPosts);
    return () => window.removeEventListener('focus', fetchPosts);
  }, [fetchPosts]);

  const handleFollowSuggestion = async (username: string) => {
    try {
      setSuggestions(prev => prev.map(s => s.username === username ? { ...s, isFollowing: true } : s));
      await axiosInstance.post(`/users/${username}/follow`);
    } catch (err) {
      console.error('Follow failed', err);
      setSuggestions(prev => prev.map(s => s.username === username ? { ...s, isFollowing: false } : s));
    }
  };

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
        <div className="max-w-6xl mx-auto px-4 py-6 md:p-8">
          
          {/* 2-Column Grid for Feed + Suggestions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Main Feed Column */}
            <div className="lg:col-span-8 space-y-6">
              <StoryBar />

              <div className="max-w-lg mx-auto w-full space-y-6">
                {isFetchingPosts ? (
                  [1, 2].map((i) => (
                    <div key={i} className="aspect-square w-full bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/20 dark:border-zinc-800/40 animate-pulse" />
                  ))
                ) : posts.length > 0 ? (
                  posts.map((post, idx) => (
                    <React.Fragment key={post.id}>
                      <PostCard post={post} />
                      
                      {/* Mobile & In-feed Suggestions after 2nd post */}
                      {idx === 1 && suggestions.length > 0 && (
                        <div className="lg:hidden p-6 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-bold text-black dark:text-white text-xs uppercase tracking-wider">Suggested for you</h3>
                          </div>
                          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                            {suggestions.map((s) => (
                              <div key={s.id} className="snap-start flex-shrink-0 w-44 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                                <Link href={`/${s.username}`} className="relative group">
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center p-[2px]">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 p-[2px] overflow-hidden">
                                      {s.avatarUrl ? (
                                        <img src={s.avatarUrl} alt={s.username} className="w-full h-full object-cover rounded-full" />
                                      ) : (
                                        <div className="w-full h-full rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 font-bold text-lg">
                                          {s.username?.[0]?.toUpperCase()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                                <div className="space-y-0.5">
                                  <Link href={`/${s.username}`} className="font-bold text-xs text-black dark:text-white block hover:underline truncate w-32">{s.username}</Link>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate w-32 leading-none">{s.reason}</p>
                                </div>
                                <button
                                  onClick={() => handleFollowSuggestion(s.username)}
                                  disabled={s.isFollowing}
                                  className={`w-full py-1.5 rounded-xl font-bold text-[11px] transition-all duration-200 ${
                                    s.isFollowing
                                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-default'
                                      : 'bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-850 dark:hover:bg-zinc-100 active:scale-95'
                                  }`}
                                >
                                  {s.isFollowing ? 'Following' : 'Follow'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">No posts yet. Start following people!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Sticky Suggestion Sidebar Column (col-span-4) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-8 space-y-6">
              
              {/* Current User Header */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                  <Link href={`/${user.username}`}>
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-rose-400 to-indigo-500 flex items-center justify-center p-[2px]">
                      <div className="w-full h-full rounded-full bg-white dark:bg-zinc-950 p-[2px] overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center text-zinc-500 font-bold">
                            {user.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div>
                    <Link href={`/${user.username}`} className="font-bold text-sm text-black dark:text-white hover:underline">{user.username}</Link>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate w-40">{user.email}</p>
                  </div>
                </div>
                <Link href={`/${user.username}`} className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Profile</Link>
              </div>

              {/* Suggestions List */}
              {suggestions.length > 0 && (
                <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-3xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold text-zinc-400 dark:text-zinc-500 text-xs uppercase tracking-wider">Suggested for you</span>
                  </div>

                  <div className="space-y-4">
                    {suggestions.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Link href={`/${s.username}`}>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-200 to-indigo-200 flex items-center justify-center p-[1px]">
                              <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 overflow-hidden">
                                {s.avatarUrl ? (
                                  <img src={s.avatarUrl} alt={s.username} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                  <div className="w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-sm">
                                    {s.username?.[0]?.toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                          <div className="min-w-0">
                            <Link href={`/${s.username}`} className="font-bold text-xs text-black dark:text-white hover:underline block truncate w-32">{s.username}</Link>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block truncate w-32" title={s.reason}>{s.reason}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFollowSuggestion(s.username)}
                          disabled={s.isFollowing}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                            s.isFollowing
                              ? 'text-zinc-400 dark:text-zinc-500 bg-transparent cursor-default'
                              : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:scale-[1.03] active:scale-95'
                          }`}
                        >
                          {s.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
