'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { Search, User as UserIcon, Camera, Heart, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await axiosInstance.get(`/search/users?query=${query}`);
        setUsers(response.data);
      } else {
        const response = await axiosInstance.get(`/search/posts?query=${query}`);
        setPosts(response.data.content || []);
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, activeTab]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        handleSearch();
      } else {
        setUsers([]);
        setPosts([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [query, handleSearch]);

  // Re-run search when tab changes if there is a query
  useEffect(() => {
    if (query.trim()) {
      handleSearch();
    }
  }, [activeTab, handleSearch]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Sidebar />
      <main className="pl-0 md:pl-20 xl:pl-64 pb-28 md:pb-8 min-h-screen bg-zinc-50/30 dark:bg-transparent flex flex-col items-center p-4 md:p-8">
        <div className="max-w-2xl w-full space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search for users or posts..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 pl-12 pr-4 py-4 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm text-black dark:text-white font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'users' ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}
            >
              Accounts
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'posts' ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-zinc-400 hover:text-black dark:hover:text-white'}`}
            >
              Posts
            </button>
          </div>

          {/* Results */}
          <div className="space-y-2">
            {isLoading ? (
              // Skeleton Loader
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 animate-pulse">
                  <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-850 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3" />
                    <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : activeTab === 'users' ? (
              users.length > 0 ? (
                users.map((user) => (
                  <Link 
                    href={`/${user.username}`} 
                    key={user.id}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors shadow-sm animate-fade-in"
                  >
                    <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-black dark:text-white">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-black dark:text-white">{user.username}</p>
                      <p className="text-xs text-zinc-400">{user.bio || 'Official Pacely User'}</p>
                    </div>
                    <div className="ml-auto text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      View Profile
                    </div>
                  </Link>
                ))
              ) : query.trim() !== '' ? (
                <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
                  No users found for "{query}"
                </div>
              ) : null
            ) : (
              posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {posts.map((post) => (
                    <Link 
                      href={`/${post.authorUsername}`} 
                      key={post.id}
                      className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-xl overflow-hidden relative group cursor-pointer border border-zinc-200/20 dark:border-zinc-800"
                    >
                      {post.mediaType === 'VIDEO' ? (
                        <video src={post.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post" />
                      )}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-xs font-bold">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4 fill-white" /> {post.likeCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 fill-white" /> {post.commentCount}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : query.trim() !== '' ? (
                <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
                  No posts found for "{query}"
                </div>
              ) : null
            )}
            
            {!isLoading && query.trim() === '' && (
              <div className="text-center py-20 text-zinc-300 dark:text-zinc-700">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Search Pacely</p>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Find your friends and interests</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
