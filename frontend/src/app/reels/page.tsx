'use client';

import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import Sidebar from '@/components/Sidebar';
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Play, ChevronUp, ChevronDown, Music2, X, Share2, Link as LinkIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { cn, getOptimizedVideoUrl, getOptimizedImageUrl } from '@/lib/utils';
import RichText from '@/components/RichText';

interface Reel {
  id: string;
  mediaUrl: string;
  content: string;
  authorUsername: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  mediaType: string;
}

export default function ReelsPage() {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Shared to Story!');
  const [showShareModal, setShowShareModal] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  useEffect(() => { fetchReels(0); }, []);

  const fetchReels = async (pageNum: number, append = false) => {
    try {
      const response = await axiosInstance.get(`/posts/reels?page=${pageNum}&size=10`);
      const videoPosts = response.data.content || [];
      if (append) setReels(prev => [...prev, ...videoPosts]);
      else setReels(videoPosts);
    } catch (err) {
      console.error('Failed to fetch reels', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setShowComments(false);
    setComments([]);
    Object.entries(videoRefs.current).forEach(([idx, video]) => {
      if (!video) return;
      if (Number(idx) === currentIndex) { 
        video.play().catch(() => {}); 
        setIsPlaying(true); 
        const reelId = reels[currentIndex]?.id;
        if (reelId) {
          axiosInstance.post(`/posts/${reelId}/view`).catch(() => {});
        }
      }
      else { video.pause(); video.currentTime = 0; }
    });
    if (currentIndex >= reels.length - 3 && reels.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReels(nextPage, true);
    }
  }, [currentIndex]);

  const goNext = () => { if (currentIndex < reels.length - 1) setCurrentIndex(p => p + 1); };
  const goPrev = () => { if (currentIndex > 0) setCurrentIndex(p => p - 1); };

  const togglePlay = () => {
    const v = videoRefs.current[currentIndex];
    if (!v) return;
    if (isPlaying) v.pause(); else v.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    const v = videoRefs.current[currentIndex];
    if (v) v.muted = newMuted;
  };

  const handleLike = async (reelId: string) => {
    if (isLiking) return;
    setIsLiking(true);
    const liked = likedReels.has(reelId);
    setLikedReels(prev => { const s = new Set(prev); liked ? s.delete(reelId) : s.add(reelId); return s; });
    setReels(r => r.map(reel => reel.id === reelId ? { ...reel, likeCount: reel.likeCount + (liked ? -1 : 1) } : reel));
    try { await axiosInstance.post(`/posts/${reelId}/like`); }
    catch { 
      setLikedReels(prev => { const s = new Set(prev); liked ? s.add(reelId) : s.delete(reelId); return s; });
      setReels(r => r.map(reel => reel.id === reelId ? { ...reel, likeCount: reel.likeCount + (liked ? 1 : -1) } : reel));
    }
    finally { setIsLiking(false); }
  };

  const handleLikeComment = async (commentId: string) => {
    const activeReel = reels[currentIndex];
    if (!activeReel) return;
    try {
      const response = await axiosInstance.post(`/posts/${activeReel.id}/comments/${commentId}/like`);
      const result = response.data;
      const liked = result === "Comment liked";
      
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, likeCount: c.likeCount + (liked ? 1 : -1), isLiked: liked } : c
      ));
    } catch (err) {
      console.error('Failed to like comment', err);
    }
  };

  const handleToggleComments = async () => {
    const activeReel = reels[currentIndex];
    if (!activeReel) return;
    if (!showComments) {
      try {
        const res = await axiosInstance.get(`/posts/${activeReel.id}/comments`);
        setComments(res.data.content || []);
      } catch { console.error('Failed to fetch comments'); }
    }
    setShowComments(prev => !prev);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeReel = reels[currentIndex];
    if (!activeReel || !newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const res = await axiosInstance.post(`/posts/${activeReel.id}/comments`, { content: newComment });
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
      setReels(r => r.map((reel, i) => i === currentIndex ? { ...reel, commentCount: reel.commentCount + 1 } : reel));
    } catch { console.error('Failed to add comment'); }
    finally { setIsSubmittingComment(false); }
  };

  const handleShare = async () => {
    const activeReel = reels[currentIndex];
    if (!activeReel) return;
    try {
      await axiosInstance.post(`/stories/from-post/${activeReel.id}`);
      setToastMessage('Shared to Story!');
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    } catch (err) {
      console.error('Failed to share reel to story', err);
    }
  };

  const fetchFollowers = async () => {
    try {
      const res = await axiosInstance.get('/users/me/followers');
      setFollowers(res.data);
    } catch (err) {
      console.error('Failed to fetch followers', err);
    }
  };

  const handleShareToFriend = async (friendUsername: string) => {
    const activeReel = reels[currentIndex];
    if (!activeReel) return;
    try {
      await axiosInstance.post(`/messages/${friendUsername}`, {
        content: activeReel.id,
        messageType: 'REEL',
        mediaUrl: activeReel.mediaUrl
      });
      setToastMessage(`Sent to ${friendUsername}!`);
      setShowShareModal(false);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    } catch (err) {
      console.error('Failed to share reel to friend', err);
    }
  };

  const handleSaveReel = async (reelId: string) => {
    try {
      const response = await axiosInstance.post(`/collections/save/${reelId}`);
      if (response.data === 'saved') {
        setSavedReels(prev => {
          const s = new Set(prev);
          s.add(reelId);
          return s;
        });
      } else if (response.data === 'removed') {
        setSavedReels(prev => {
          const s = new Set(prev);
          s.delete(reelId);
          return s;
        });
      }
    } catch (err) {
      console.error('Failed to toggle save for reel', err);
    }
  };

  useEffect(() => {
    const syncSavedReels = async () => {
      try {
        const collectionsRes = await axiosInstance.get('/collections');
        const defaultCol = collectionsRes.data.find((c: any) => c.name === 'All Posts');
        if (defaultCol) {
          const postsRes = await axiosInstance.get(`/collections/${defaultCol.id}/posts`);
          const savedIds = new Set<string>(postsRes.data.map((p: any) => p.id));
          setSavedReels(savedIds);
        }
      } catch (err) {
        console.error('Failed to sync saved reels', err);
      }
    };
    if (user) {
      syncSavedReels();
    }
  }, [user]);

  const handleDeleteReel = async (reelId: string) => {
    if (!confirm('Are you sure you want to delete this reel? This action cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/posts/${reelId}`);
      setReels(prev => {
        const updated = prev.filter(r => r.id !== reelId);
        if (currentIndex >= updated.length && updated.length > 0) {
          setCurrentIndex(updated.length - 1);
        }
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete reel', err);
      alert('Failed to delete reel. Please try again.');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Sidebar />
      <div className="pl-0 md:pl-20 xl:pl-64 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (reels.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <Sidebar />
      <div className="pl-0 md:pl-20 xl:pl-64 flex flex-col items-center justify-center min-h-screen gap-4">
      <Play className="w-16 h-16 text-zinc-300 dark:text-zinc-700" />
      <p className="text-xl font-bold text-black dark:text-white">No Reels Yet</p>
      <p className="text-zinc-400 dark:text-zinc-500 text-sm">Post a video to be the first!</p>
      <Link href="/create" className="mt-2 px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full text-sm">Create Reel</Link>
      </div>
    </div>
  );

  const currentReel = reels[currentIndex];
  const isAuthor = !!(user?.username && currentReel && user.username === currentReel.authorUsername);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-violet-50 via-white to-rose-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 w-full max-w-full overflow-x-hidden relative">
      <Sidebar />
      <div className="pl-0 md:pl-20 xl:pl-64 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0 min-h-[100dvh] w-full max-w-full overflow-x-hidden flex flex-col md:flex-row gap-0 md:gap-6 p-0 md:p-8 items-center justify-center md:items-start md:justify-start">

        {/* LEFT: arrows + card */}
        <div className="flex gap-0 md:gap-4 items-center pt-0 md:pt-6 w-full md:w-auto justify-center max-w-full overflow-x-hidden">

          {/* Nav arrows stacked on left */}
          <div className="hidden md:flex flex-col gap-3">
            <button onClick={goPrev} disabled={currentIndex === 0}
              className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white disabled:opacity-20 transition-all shadow-sm">
              <ChevronUp className="w-5 h-5" />
            </button>
            <button onClick={goNext} disabled={currentIndex === reels.length - 1}
              className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white disabled:opacity-20 transition-all shadow-sm">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Reel Card */}
          <div className="relative w-full h-[calc(100dvh-80px-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px))] md:w-[340px] md:h-[620px] md:rounded-3xl overflow-hidden shadow-2xl shadow-black/20 flex-shrink-0 max-w-full md:max-w-[340px]">
            <AnimatePresence mode="wait">
              <motion.div key={currentIndex}
                initial={{ y: '100%', opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.2, ease: 'linear' }}
                style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
                className="absolute inset-0">

                <video ref={el => { videoRefs.current[currentIndex] = el; }} src={currentReel?.mediaUrl ? getOptimizedVideoUrl(currentReel.mediaUrl) : ''}
                  className="w-full h-full object-cover" loop autoPlay muted={isMuted} playsInline onClick={togglePlay} preload="auto" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                <AnimatePresence>
                  {!isPlaying && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Top bar */}
                <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10">
                  <span className="text-white font-black text-lg italic tracking-tighter">Reels</span>
                  <span className="text-white/60 text-xs font-bold">{currentIndex + 1} / {reels.length}</span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-0 left-0 right-14 p-4 z-10">
                  <Link href={`/${currentReel?.authorUsername || ''}`} className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-white text-sm">
                        {currentReel?.authorUsername?.[0]?.toUpperCase() || ''}
                      </div>
                    </div>
                    <p className="text-white font-bold text-sm">@{currentReel?.authorUsername || ''}</p>
                    <button className="ml-1 px-3 py-0.5 border border-white rounded-full text-white text-xs font-bold hover:bg-white hover:text-black transition-colors">Follow</button>
                  </Link>
                  <p className="text-white text-sm mb-2 line-clamp-2">
                    <RichText text={currentReel?.content || ''} />
                  </p>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    <Music2 className="w-3 h-3" />
                    <span className="italic">Original Audio · @{currentReel?.authorUsername || ''}</span>
                  </div>
                </div>

                {/* Right Action Bar */}
                <div className="absolute right-3 bottom-20 flex flex-col items-center gap-5 z-10">
                  <div className="flex flex-col items-center gap-1">
                    <Play className="w-5 h-5 text-white drop-shadow fill-white" />
                    <span className="text-white text-[10px] font-bold">{currentReel?.viewCount || 0}</span>
                  </div>
                  <motion.button whileTap={{ scale: 1.4 }} onClick={() => currentReel && handleLike(currentReel.id)} disabled={isLiking} className="flex flex-col items-center gap-1">
                    <Heart className={cn('w-7 h-7 drop-shadow transition-colors', (currentReel ? likedReels.has(currentReel.id) : false) ? 'fill-red-500 text-red-500' : 'text-white')} />
                    <span className="text-white text-[10px] font-bold">{currentReel?.likeCount || 0}</span>
                  </motion.button>
                  <button onClick={handleToggleComments} className="flex flex-col items-center gap-1">
                    <MessageCircle className={cn('w-7 h-7 drop-shadow', showComments ? 'text-yellow-400' : 'text-white')} />
                    <span className="text-white text-[10px] font-bold">{currentReel?.commentCount || 0}</span>
                  </button>
                  <button onClick={() => { fetchFollowers(); setShowShareModal(true); }} className="flex flex-col items-center gap-1">
                    <Share2 className="w-6 h-6 text-white drop-shadow" />
                    <span className="text-white text-[10px] font-bold">Share</span>
                  </button>
                  <motion.button whileTap={{ scale: 1.4 }}
                    onClick={() => currentReel && handleSaveReel(currentReel.id)}
                    className="flex flex-col items-center gap-1">
                    <Bookmark className={cn('w-6 h-6 drop-shadow', (currentReel ? savedReels.has(currentReel.id) : false) ? 'fill-white text-white' : 'text-white')} />
                    <span className="text-white text-[10px] font-bold">Save</span>
                  </motion.button>
                  {isAuthor && currentReel && (
                    <motion.button 
                      whileTap={{ scale: 1.4 }} 
                      onClick={() => handleDeleteReel(currentReel.id)} 
                      className="flex flex-col items-center gap-1 text-rose-500 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-6 h-6 drop-shadow filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.4)]" />
                      <span className="text-white text-[10px] font-bold">Delete</span>
                    </motion.button>
                  )}
                  <button onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                  </button>
                </div>

              </motion.div>
            </AnimatePresence>

            {/* Preload next Reel in the background to ensure instant lag-free swiping */}
            {reels[currentIndex + 1] && (
              <video
                key={`preload-${currentIndex + 1}`}
                src={getOptimizedVideoUrl(reels[currentIndex + 1].mediaUrl)}
                preload="auto"
                muted
                className="hidden"
              />
            )}
          </div>
        </div>

        {/* RIGHT: Comments Panel */}
        <AnimatePresence>
          {showComments && (
            <>
              {/* Backdrop on mobile only */}
              <div 
                className="md:hidden fixed inset-0 bg-black/40 z-40" 
                onClick={() => setShowComments(false)}
              />
              <motion.div 
                initial={{ opacity: 0, y: 100 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.25 }}
                className="fixed bottom-0 left-0 right-0 h-[60vh] md:relative md:h-[620px] md:w-80 bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-3xl shadow-2xl md:shadow-xl border-t md:border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden flex-shrink-0 mt-0 md:mt-6 z-50"
              >
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <p className="font-bold text-black dark:text-white">Comments</p>
                  <button onClick={() => setShowComments(false)} className="text-zinc-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {comments.length === 0
                    ? <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center mt-8 italic">No comments yet. Be the first!</p>
                    : comments.map((c, i) => (
                      <div key={i} className="flex gap-3 text-sm justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px] shrink-0">
                            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-[9px] font-bold overflow-hidden text-black dark:text-white">
                              {c.authorAvatarUrl ? (
                                <img src={getOptimizedImageUrl(c.authorAvatarUrl)} alt={c.authorUsername} className="w-full h-full object-cover" />
                              ) : (
                                c.authorUsername?.[0]?.toUpperCase()
                              )}
                            </div>
                          </div>
                          <div><span className="font-bold text-black dark:text-white mr-2">{c.authorUsername}</span><span className="text-zinc-600 dark:text-zinc-300">{c.content}</span></div>
                        </div>
                        <button onClick={() => handleLikeComment(c.id)} className="flex flex-col items-center gap-0.5 shrink-0">
                          <Heart className={cn("w-4 h-4 transition-colors", c.isLiked ? "fill-red-500 text-red-500" : "text-zinc-400 dark:text-zinc-500 hover:text-red-500")} />
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{c.likeCount}</span>
                        </button>
                      </div>
                    ))
                  }
                </div>
                <form onSubmit={handleAddComment} className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                  <input type="text" placeholder="Add a comment..."
                    className="flex-1 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-black dark:text-white"
                    value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-full disabled:opacity-30">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-3xl w-96 max-h-[450px] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <p className="font-bold text-black dark:text-white">Share Reel</p>
                <button onClick={() => setShowShareModal(false)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={async () => {
                    await handleShare();
                    setShowShareModal(false);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-yellow-400 to-purple-600 text-white font-bold rounded-full text-sm hover:opacity-90 cursor-pointer"
                >
                  Share to My Story
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase">Send to Friends</p>
                {followers.length === 0 ? (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm text-center mt-4">No followers found.</p>
                ) : (
                  followers.map((f, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px] shrink-0">
                          <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-black dark:text-white">
                            {f.username?.[0]?.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-black dark:text-white text-sm">{f.username}</p>
                          <p className="text-zinc-400 dark:text-zinc-500 text-xs">{f.bio || "No bio"}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleShareToFriend(f.username)}
                        className="px-4 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-bold rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

      {/* Share toast */}
      <AnimatePresence>
        {showShareToast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-sm font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-xl z-50">
            <Share2 className="w-4 h-4" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
