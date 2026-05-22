'use client';

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { Heart, MessageCircle, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('For You');
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const categories = ['For You', 'Trending', 'Travel', 'Food', 'Art', 'Fitness', 'Music', 'Style'];

  const fetchExplorePosts = async (pageNum: number, category: string, append = false) => {
    setIsLoading(true);
    try {
      let url = `/posts/explore?page=${pageNum}&size=15`;
      
      // If not "For You", use the search endpoint to filter by category!
      if (category !== 'For You') {
        url = `/search/posts?query=${category}&page=${pageNum}&size=15`;
      }

      const response = await axiosInstance.get(url);
      const newPosts = response.data.content || [];
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
        setHasMore(true);
      }
    } catch (err) {
      console.error('Failed to fetch explore posts', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect for changing categories
  useEffect(() => {
    setPage(0);
    fetchExplorePosts(0, activeCategory, false);
  }, [activeCategory]);

  // Effect for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchExplorePosts(nextPage, activeCategory, true);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [observerTarget, hasMore, isLoading, page, activeCategory]);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Sidebar />
      <main className="pl-0 md:pl-20 xl:pl-64 pb-28 md:pb-8 min-h-screen bg-zinc-50/30 dark:bg-transparent flex flex-col items-center p-4 md:p-8">
        <div className="max-w-4xl w-full space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-black dark:text-white">Explore</h1>
          </div>

          {/* Category Pills (Feature 1) */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === category 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'bg-white border border-zinc-200 text-zinc-500 hover:border-black hover:text-black dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Grid (Feature 2: Reels Layout) */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 md:gap-4 auto-rows-[1fr]">
              {posts.map((post, index) => {
                // Feature 2: Every 6th post is a tall "Reels" style post!
                const isTall = index % 6 === 2;

                return (
                  <Link 
                    href={`/${post.authorUsername}`} 
                    key={`${post.id}-${index}`}
                    className={`bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden relative group cursor-pointer border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm ${
                      isTall ? 'row-span-2 h-full' : 'aspect-square'
                    }`}
                  >
                    {post.mediaType === 'VIDEO' ? (
                      <video src={post.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Explore" />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white font-bold text-sm">
                      <div className="flex items-center gap-1">
                        <Heart className="w-5 h-5 fill-white" /> {post.likeCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-5 h-5 fill-white" /> {post.commentCount}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : !isLoading ? (
            <div className="text-center py-20 text-zinc-300 dark:text-zinc-700 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No Posts Found</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Try another category</p>
            </div>
          ) : null}

          {/* Infinite Scroll Target (Feature 3) */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {isLoading && (
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-black dark:border-t-white rounded-full animate-spin" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
