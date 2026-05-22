'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import RichText from '@/components/RichText';
import { useAuth } from '@/context/AuthContext';

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
  showDelete?: boolean; // Only show delete option on Profile page
  onDeleted?: (postId: string) => void; // Callback when post is deleted
}

export default function PostCard({ post, showDelete = false, onDeleted }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
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

  const { user } = useAuth();
  const isAuthor = user?.username === post.authorUsername;

  useEffect(() => {
    const checkSavedState = async () => {
      try {
        const collectionsRes = await axiosInstance.get('/collections');
        const defaultCol = collectionsRes.data.find((c: any) => c.name === 'All Posts');
        if (defaultCol) {
          const postsRes = await axiosInstance.get(`/collections/${defaultCol.id}/posts`);
          const isPostSaved = postsRes.data.some((p: any) => p.id === post.id);
          setIsSaved(isPostSaved);
        }
      } catch (err) {
        console.error('Failed to check saved state', err);
      }
    };
    checkSavedState();
  }, [post.id]);

  const handleSave = async () => {
    try {
      const response = await axiosInstance.post(`/collections/save/${post.id}`);
      if (response.data === 'saved') {
        setIsSaved(true);
      } else if (response.data === 'removed') {
        setIsSaved(false);
      }
    } catch (err) {
      console.error('Failed to save post', err);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/posts/${post.id}`);
      setShowMenu(false);
      if (onDeleted) onDeleted(post.id);
      else setIsHidden(true);
    } catch (err) {
      console.error('Failed to delete post', err);
      alert('Failed to delete post. Please try again.');
    }
  };

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
      className="glass-container rounded-3xl overflow-hidden mb-6 transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-zinc-100 overflow-hidden">
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt={post.authorUsername} className="w-full h-full object-cover" />
              ) : (
                post.authorUsername[0].toUpperCase()
              )}
            </div>
          </div>
          <div>
            <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{post.authorUsername}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-bold tracking-tighter">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="relative">
          <MoreHorizontal 
            className="w-5 h-5 text-zinc-400 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" 
            onClick={() => setShowMenu(!showMenu)}
          />
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xl z-20 py-2 overflow-hidden">
              {isAuthor && showDelete ? (
                <button 
                  onClick={handleDeletePost} 
                  className="w-full text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Delete Post
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { setShowMenu(false); alert('Post reported.'); }} 
                    className="w-full text-left px-4 py-2 text-sm text-red-500 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Report
                  </button>
                  <button 
                    onClick={() => { setShowMenu(false); alert('Added to interested.'); }} 
                    className="w-full text-left px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Interested
                  </button>
                  <button 
                    onClick={() => { setShowMenu(false); alert('Marked as not interested.'); }} 
                    className="w-full text-left px-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Not Interested
                  </button>
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      setIsHidden(true);
                    }} 
                    className="w-full text-left px-4 py-2 text-sm text-zinc-400 dark:text-zinc-500 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Don't recommend again
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media Content */}
      <div 
        className="relative aspect-square bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center overflow-hidden cursor-pointer"
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
            <motion.div whileTap={{ scale: 1.3 }}>
              <Heart 
                onClick={handleLike}
                className={cn("w-7 h-7 cursor-pointer transition-all duration-250", isLiked ? "text-red-500 fill-red-500" : "text-zinc-800 dark:text-zinc-200")} 
              />
            </motion.div>
            <motion.div whileTap={{ scale: 1.2 }}>
              <MessageCircle onClick={fetchComments} className={cn("w-7 h-7 text-zinc-800 dark:text-zinc-200 cursor-pointer", showComments && "text-indigo-600 dark:text-indigo-400")} />
            </motion.div>
            <motion.div whileTap={{ scale: 1.2 }}>
              <Send className="w-7 h-7 text-zinc-800 dark:text-zinc-200 cursor-pointer" />
            </motion.div>
          </div>
          <motion.div whileTap={{ scale: 1.2 }}>
            <Bookmark 
              onClick={handleSave} 
              className={cn(
                "w-7 h-7 cursor-pointer transition-colors", 
                isSaved 
                  ? "text-indigo-600 fill-indigo-600 dark:text-indigo-400 dark:fill-indigo-400" 
                  : "text-zinc-800 dark:text-zinc-200"
              )} 
            />
          </motion.div>
        </div>

        <div className="space-y-1">
          <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{likes.toLocaleString()} likes</p>
          <div className="text-sm text-zinc-800 dark:text-zinc-200">
            <span className="font-bold mr-2 text-zinc-900 dark:text-zinc-100">{post.authorUsername}</span>
            <RichText text={post.content} />
          </div>
          <p onClick={fetchComments} className="text-zinc-400 dark:text-zinc-500 text-xs font-semibold cursor-pointer hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors mt-1 select-none">
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
              className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-4 overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto space-y-3 no-scrollbar">
                {comments.map((c, i) => (
                  <div key={c.id || i} className="flex gap-2 text-sm items-start justify-between">
                    <div className="flex gap-2 items-start">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[1.5px] shrink-0 mt-0.5">
                        <div className="w-full h-full rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-900 dark:text-zinc-100 overflow-hidden">
                          {c.authorAvatarUrl ? (
                            <img src={c.authorAvatarUrl} alt={c.authorUsername} className="w-full h-full object-cover" />
                          ) : (
                            c.authorUsername?.[0]?.toUpperCase()
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 mr-2">{c.authorUsername}</span>
                        <span className="text-zinc-600 dark:text-zinc-300">{c.content}</span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400 dark:text-zinc-500 font-semibold">
                          <span>{c.likeCount || 0} likes</span>
                          <button 
                            onClick={() => {
                              setNewComment(`@${c.authorUsername} `);
                              setReplyingTo(c.id);
                              commentInputRef.current?.focus();
                            }}
                            className="font-bold hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                    <Heart 
                      onClick={() => handleLikeComment(c.id)}
                      className={cn("w-4 h-4 cursor-pointer mt-1 transition-colors", c.isLiked ? "text-red-500 fill-red-500" : "text-zinc-400 dark:text-zinc-500")} 
                    />
                  </div>
                ))}
                {comments.length === 0 && <p className="text-zinc-400 dark:text-zinc-500 text-xs italic">No comments yet.</p>}
              </div>

              <form onSubmit={handleAddComment} className="relative flex items-center mt-2">
                <input 
                  ref={commentInputRef}
                  type="text" 
                  placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-100 dark:border-zinc-800 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="absolute right-2 p-2 text-indigo-600 dark:text-indigo-400 disabled:opacity-0 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
