'use client';

import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { X, ChevronLeft, ChevronRight, Trash2, User } from 'lucide-react';

interface Story {
  id: string;
  mediaUrl: string;
  mediaType: string;
  authorUsername: string;
  authorAvatarUrl?: string;
}

export default function StoryBar() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // For viewing stories
  const [activeStoryUser, setActiveStoryUser] = useState<string | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0); // For the time lapse/timer

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');

    try {
      const response = await axiosInstance.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStories(prev => [response.data, ...prev]);
    } catch (err) {
      console.error('Failed to create story', err);
    }
  };

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await axiosInstance.get('/stories/feed');
        setStories(response.data);
      } catch (err) {
        console.error('Failed to fetch stories', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStories();
  }, []);

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.authorUsername]) {
      acc[story.authorUsername] = [];
    }
    acc[story.authorUsername].push(story);
    return acc;
  }, {} as Record<string, Story[]>);

  const myStories = user ? groupedStories[user.username] || [] : [];
  const otherUsers = Object.keys(groupedStories).filter(username => username !== user?.username);
  
  // All users with stories in order
  const allStoryUsers = [user?.username, ...otherUsers].filter(u => u && groupedStories[u]) as string[];

  const handleViewStory = (username: string) => {
    setActiveStoryUser(username);
    setCurrentStoryIndex(0);
    setProgress(0);
  };

  const closeStoryViewer = () => {
    setActiveStoryUser(null);
    setProgress(0);
  };

  const nextStory = () => {
    if (!activeStoryUser) return;
    const userStories = groupedStories[activeStoryUser];
    
    if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to NEXT USER's story instead of closing!
      const currentUserIdx = allStoryUsers.indexOf(activeStoryUser);
      if (currentUserIdx < allStoryUsers.length - 1) {
        setActiveStoryUser(allStoryUsers[currentUserIdx + 1]);
        setCurrentStoryIndex(0);
        setProgress(0);
      } else {
        closeStoryViewer();
      }
    }
  };

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to PREVIOUS USER's story
      const currentUserIdx = allStoryUsers.indexOf(activeStoryUser!);
      if (currentUserIdx > 0) {
        const prevUser = allStoryUsers[currentUserIdx - 1];
        setActiveStoryUser(prevUser);
        const prevUserStories = groupedStories[prevUser];
        setCurrentStoryIndex(prevUserStories.length - 1);
        setProgress(0);
      }
    }
  };

  // Autoplay Timer (Time Lapse)
  useEffect(() => {
    if (!activeStoryUser || !stories.length) return;
    const activeStories = groupedStories[activeStoryUser];
    const currentStory = activeStories[currentStoryIndex];

    if (!currentStory) return;

    // For videos, let the video element's onEnded handle the skip
    if (currentStory.mediaType === 'VIDEO') return;

    // For images, use a 5-second timer
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          nextStory();
          return 100;
        }
        return prev + 1; // Increment by 1 every 50ms = 5 seconds total
      });
    }, 50);

    return () => clearInterval(timer);
  }, [activeStoryUser, currentStoryIndex, stories]);

  const handleDeleteStory = async () => {
    const activeStories = activeStoryUser ? groupedStories[activeStoryUser] : [];
    const currentStory = activeStories[currentStoryIndex];
    if (!currentStory) return;

    try {
      await axiosInstance.delete(`/stories/${currentStory.id}`);
      setStories(prev => prev.filter(s => s.id !== currentStory.id));
      const userStories = groupedStories[activeStoryUser!];
      if (userStories.length === 1) {
        closeStoryViewer();
      } else {
        nextStory();
      }
    } catch (err) {
      console.error('Failed to delete story', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 mb-6 shadow-xl shadow-indigo-100/30 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex-shrink-0 space-y-2">
            <div className="w-16 h-16 rounded-full bg-zinc-100" />
            <div className="h-2 w-12 bg-zinc-100 mx-auto rounded" />
          </div>
        ))}
      </div>
    );
  }

  const activeStories = activeStoryUser ? groupedStories[activeStoryUser] : [];
  const currentStory = activeStories[currentStoryIndex];

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar bg-white/70 backdrop-blur-md rounded-3xl border border-white/60 mb-6 shadow-xl shadow-indigo-100/30">
        
        {/* My Story (Your Story) */}
        <div className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileChange}
          />
          
          <div className="relative">
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center p-[2px] ${myStories.length > 0 ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' : 'border border-zinc-200'}`}
              onClick={() => myStories.length > 0 ? handleViewStory(user!.username) : fileInputRef.current?.click()}
            >
              <div className="w-full h-full rounded-full bg-white p-[2px] flex items-center justify-center overflow-hidden bg-zinc-50">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    className="w-full h-full rounded-full object-cover"
                    alt="Your Story"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-zinc-400" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Small add badge */}
            <div 
              className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              +
            </div>
          </div>
          
          <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tighter">Your Story</span>
        </div>

        {/* Other Users' Stories */}
        {otherUsers.map((username) => {
          const userStories = groupedStories[username];
          const avatarUrl = userStories[0].authorAvatarUrl;
          return (
            <motion.div 
              key={username}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
              onClick={() => handleViewStory(username)}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2.5px]">
                <div className="w-full h-full rounded-full bg-white p-[2px]">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      className="w-full h-full rounded-full object-cover"
                      alt={username}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center">
                      <User className="w-8 h-8 text-zinc-400" />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tighter w-16 text-center truncate">
                {username}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {activeStoryUser && currentStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center"
          >
            {/* Close Button */}
            <button 
              onClick={closeStoryViewer}
              className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-20">
              <button 
                onClick={prevStory}
                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextStory}
                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Content Card */}
            <div className="w-full max-w-md aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden relative shadow-2xl">
              
              {/* Progress Bars (Restored and Functional!) */}
              <div className="absolute top-0 inset-x-0 flex gap-1 p-2 z-10">
                {groupedStories[activeStoryUser].map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-300"
                      style={{ 
                        width: i === currentStoryIndex ? `${progress}%` : i < currentStoryIndex ? '100%' : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-4 left-0 right-0 px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-black overflow-hidden">
                    {currentStory.authorAvatarUrl ? (
                      <img src={currentStory.authorAvatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      activeStoryUser[0].toUpperCase()
                    )}
                  </div>
                  <span className="text-white font-bold text-sm drop-shadow-md">{activeStoryUser}</span>
                </div>
                
                {activeStoryUser === user?.username && (
                  <button 
                    onClick={handleDeleteStory}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Media */}
              <div className="w-full h-full flex items-center justify-center">
                {currentStory.mediaType === 'VIDEO' ? (
                  <video 
                    src={currentStory.mediaUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    controls={false}
                    onEnded={nextStory}
                    onTimeUpdate={(e) => {
                      const video = e.currentTarget;
                      const percent = (video.currentTime / video.duration) * 100;
                      setProgress(percent);
                    }}
                  />
                ) : (
                  <img 
                    src={currentStory.mediaUrl} 
                    className="w-full h-full object-cover"
                    alt="Story"
                    onClick={nextStory} // Tap to go to next story
                  />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
