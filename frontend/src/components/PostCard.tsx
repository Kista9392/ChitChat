'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Send as SendIcon } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from '@/components/RichText';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    mediaUrl: string;
    mediaType: string;
    authorUsername: string;
    authorAvatarUrl?: string;
    likeCount: number;
    commentCount: number;
    createdAt: string;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likeCount);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const handleLike = async () => {
    try {
      const response = await axiosInstance.post(`/posts/${post.id}/like`);
      if (response.data === 'Post liked successfully!') {
        setIsLiked(true);
        setLikes(prev => prev + 1);
        setShowHeartAnim(true);
        setTimeout(() => setShowHeartAnim(false), 1000);
      } else if (response.data === 'Post unliked successfully!') {
        setIsLiked(false);
        setLikes(prev => prev - 1);
      }
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const fetchComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }
    try {
      const response = await axiosInstance.get(`/posts/${post.id}/comments`);
      setComments(response.data.content || []);
      setShowComments(true);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const response = await axiosInstance.post(`/posts/${post.id}/comments`, {
        content: newComment,
        parentId: replyingTo
      });
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
      setReplyingTo(null);
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await axiosInstance.post(`/posts/${post.id}/comments/${commentId}/like`);
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          const isLikedNow = response.data === 'Comment liked';
          return {
            ...c,
            isLiked: isLikedNow,
            likeCount: isLikedNow ? c.likeCount + 1 : c.likeCount - 1
          };
        }
        return c;
      }));
    } catch (err) {
      console.error('Failed to like comment', err);
    }
  };

  if (isHidden) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-3xl border border-white/60 dark:border-zinc-800 shadow-xl shadow-indigo-100/30 dark:shadow-none overflow-hidden mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-xs text-black overflow-hidden">
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt={post.authorUsername} className="w-full h-full object-cover" />
              ) : (
                post.authorUsername[0].toUpperCase()
              )}
            </div>
          </div>
          <div>
            <p className="font-bold text-sm text-black">{post.authorUsername}</p>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tighter">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="relative">
          <MoreHorizontal 
            className="w-5 h-5 text-zinc-400 cursor-pointer hover:text-black transition-colors" 
            onClick={() => setShowMenu(!showMenu)}
          />
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-zinc-100 shadow-xl z-20 py-2 overflow-hidden">
              <button 
                onClick={() => { setShowMenu(false); alert('Post reported.'); }} 
                className="w-full text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-zinc-50 transition-colors"
              >
                Report
              </button>
              <button 
                onClick={() => { setShowMenu(false); alert('Added to interested.'); }} 
                className="w-full text-left px-4 py-2 text-sm text-black font-medium hover:bg-zinc-50 transition-colors"
              >
                Interested
              </button>
              <button 
                onClick={() => { setShowMenu(false); alert('Marked as not interested.'); }} 
                className="w-full text-left px-4 py-2 text-sm text-black font-medium hover:bg-zinc-50 transition-colors"
              >
                Not Interested
              </button>
              <button 
                onClick={() => {
                  setShowMenu(false);
                  setIsHidden(true);
                }} 
                className="w-full text-left px-4 py-2 text-sm text-zinc-500 font-medium hover:bg-zinc-50 transition-colors"
              >
                Don't recommend again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Media Content */}
      <div 
        className="relative aspect-square bg-zinc-50 flex items-center justify-center overflow-hidden cursor-pointer"
        onDoubleClick={handleLike}
      >
        {post.mediaType === 'VIDEO' ? (
          <video 
            src={post.mediaUrl} 
            className="w-full h-full object-cover" 
            autoPlay 
            muted 
            loop 
          />
        ) : (
          <img 
            src={post.mediaUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60'} 
            alt="Post Content"
            className="w-full h-full object-cover"
          />
        )}

        <AnimatePresence>
          {showHeartAnim && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart 
              onClick={handleLike}
              className={cn("w-7 h-7 cursor-pointer transition-all active:scale-125", isLiked ? "text-red-500 fill-red-500" : "text-black")} 
            />
            <MessageCircle onClick={fetchComments} className={cn("w-7 h-7 text-black cursor-pointer", showComments && "text-indigo-600")} />
            <Send className="w-7 h-7 text-black cursor-pointer" />
          </div>
          <Bookmark className="w-7 h-7 text-black cursor-pointer" />
        </div>

        <div className="space-y-1">
          <p className="font-bold text-sm text-black">{likes.toLocaleString()} likes</p>
          <p className="text-sm text-zinc-800">
            <span className="font-bold mr-2">{post.authorUsername}</span>
            <RichText text={post.content} />
          </p>
          <p onClick={fetchComments} className="text-zinc-400 text-xs font-medium cursor-pointer hover:text-black transition-colors">
            {showComments ? 'Hide comments' : `View all ${post.commentCount} comments`}
          </p>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-zinc-100 space-y-4 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar">
                {comments.map((c, i) => (
                  <div key={c.id || i} className="flex gap-2 text-sm items-start justify-between">
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px] shrink-0 mt-0.5">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[8px] font-bold text-black overflow-hidden">
                          {c.authorAvatarUrl ? (
                            <img src={c.authorAvatarUrl} alt={c.authorUsername} className="w-full h-full object-cover" />
                          ) : (
                            c.authorUsername?.[0]?.toUpperCase()
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-black mr-2">{c.authorUsername}</span>
                        <span className="text-zinc-600">{c.content}</span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                          <span>{c.likeCount || 0} likes</span>
                          <button 
                            onClick={() => {
                              setNewComment(`@${c.authorUsername} `);
                              setReplyingTo(c.id);
                              commentInputRef.current?.focus();
                            }}
                            className="font-bold hover:text-zinc-600"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                    <Heart 
                      onClick={() => handleLikeComment(c.id)}
                      className={cn("w-4 h-4 cursor-pointer mt-1", c.isLiked ? "text-red-500 fill-red-500" : "text-zinc-400")} 
                    />
                  </div>
                ))}
                {comments.length === 0 && <p className="text-zinc-400 text-xs italic">No comments yet.</p>}
              </div>

              <form onSubmit={handleAddComment} className="relative flex items-center">
                <input 
                  ref={commentInputRef}
                  type="text" 
                  placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                  className="w-full text-sm bg-zinc-50 border border-zinc-100 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-black"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="absolute right-2 p-1 text-indigo-600 disabled:opacity-0 transition-opacity"
                >
                  <SendIcon className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
