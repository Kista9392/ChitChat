'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { Grid, Bookmark, User as UserIcon, Camera, UserPlus, UserCheck, Plus, Trash2, FolderOpen, Heart, MessageCircle, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

  // Saved collections state
  const [collections, setCollections] = useState<any[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<any | null>(null);
  const [collectionPosts, setCollectionPosts] = useState<any[]>([]);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // Followers/Following modal state
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<any[]>([]);
  const [isLoadingFollowList, setIsLoadingFollowList] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  const isOwnProfile = currentUser?.username === username;

  const fetchFollowList = async (type: 'followers' | 'following') => {
    setShowFollowModal(type);
    setIsLoadingFollowList(true);
    setFollowError(null);
    try {
      const res = await axiosInstance.get(`/users/${username}/${type}`);
      setFollowList(res.data);
    } catch (err: any) {
      console.error(`Failed to fetch ${type}`, err);
      setFollowError(err.response?.data?.message || `Failed to load ${type}`);
    } finally {
      setIsLoadingFollowList(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    const fetchProfileData = async () => {
      try {
        const [profileRes, postsRes] = await Promise.all([
          axiosInstance.get(`/users/${username}`),
          axiosInstance.get(`/posts/user/${username}`)
        ]);
        setProfile(profileRes.data);
        setEditBio(profileRes.data?.bio || '');
        setPosts(postsRes.data);
        setIsFollowing(profileRes.data?.isFollowing || false);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [username]);

  // Fetch collections when saved tab opened
  useEffect(() => {
    if (activeTab === 'saved' && isOwnProfile) {
      fetchCollections();
    }
  }, [activeTab, isOwnProfile]);

  const fetchCollections = async () => {
    try {
      const res = await axiosInstance.get('/collections');
      setCollections(res.data || []);
    } catch (err) { console.error('Failed to fetch collections', err); }
  };

  const openCollection = async (col: any) => {
    setSelectedCollection(col);
    try {
      const res = await axiosInstance.get(`/collections/${col.id}/posts`);
      setCollectionPosts(res.data || []);
    } catch (err) { console.error('Failed to fetch collection posts', err); }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return;
    setIsCreating(true);
    try {
      const res = await axiosInstance.post('/collections', { name: newCollectionName.trim() });
      setCollections(prev => [...prev, res.data]);
      setNewCollectionName('');
      setShowNewCollectionModal(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create collection');
    } finally { setIsCreating(false); }
  };

  const deleteCollection = async (colId: string) => {
    if (!confirm('Delete this collection?')) return;
    try {
      await axiosInstance.delete(`/collections/${colId}`);
      setCollections(prev => prev.filter(c => c.id !== colId));
      if (selectedCollection?.id === colId) setSelectedCollection(null);
    } catch (err: any) { alert(err?.response?.data?.message || 'Failed to delete collection'); }
  };

  const handleFollow = async () => {
    try {
      const response = await axiosInstance.post(`/users/${username}/follow`);
      if (response.data.includes('Unfollowed')) {
        setIsFollowing(false);
        setProfile((prev: any) => ({ ...prev, followerCount: prev.followerCount - 1 }));
      } else {
        setIsFollowing(true);
        setProfile((prev: any) => ({ ...prev, followerCount: prev.followerCount + 1 }));
      }
    } catch (err) { console.error('Follow failed', err); }
  };

  const saveEditProfile = async () => {
    setIsSavingBio(true);
    try {
      // Upload avatar first if selected
      if (avatarFile) {
        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('file', avatarFile);
        const avatarRes = await axiosInstance.post('/users/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setProfile((prev: any) => ({ ...prev, avatarUrl: avatarRes.data.avatarUrl }));
        setIsUploadingAvatar(false);
      }
      // Then save bio
      await axiosInstance.put('/users/me', { bio: editBio });
      setProfile((prev: any) => ({ ...prev, bio: editBio }));
      setAvatarFile(null);
      setAvatarPreview(null);
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSavingBio(false);
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50/30">
      <Sidebar />
      <main className="pl-20 xl:pl-64 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 md:p-8">

          {/* Profile Header */}
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 mb-6">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl md:text-5xl font-black text-white">
                    {profile?.username?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              {isOwnProfile && (
                <div
                  onClick={() => setShowEditModal(true)}
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-col md:flex-row items-center md:items-center gap-4">
                <h2 className="text-2xl font-bold text-black">{profile?.username}</h2>
                {isOwnProfile ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-sm rounded-xl transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleFollow}
                      className={cn('px-6 py-1.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
                        isFollowing ? 'bg-zinc-100 text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                      )}
                    >
                      {isFollowing ? <><UserCheck className="w-4 h-4" /> Following</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                    </button>
                    {isFollowing && (
                      <Link
                        href={`/messages?user=${username}`}
                        className="px-6 py-1.5 bg-zinc-100 text-black hover:bg-zinc-200 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex justify-center md:justify-start gap-8">
                <div className="text-center">
                  <p className="font-black text-black text-lg">{posts.length}</p>
                  <p className="text-zinc-500 text-xs">posts</p>
                </div>
                <div className="text-center cursor-pointer" onClick={() => fetchFollowList('followers')}>
                  <p className="font-black text-black text-lg">{profile?.followerCount || 0}</p>
                  <p className="text-zinc-500 text-xs">followers</p>
                </div>
                <div className="text-center cursor-pointer" onClick={() => fetchFollowList('following')}>
                  <p className="font-black text-black text-lg">{profile?.followingCount || 0}</p>
                  <p className="text-zinc-500 text-xs">following</p>
                </div>
              </div>

              {/* Bio */}
              <div>
                <p className="font-bold text-black text-sm">{profile?.username}</p>
                <p className="text-zinc-500 text-sm mt-1 whitespace-pre-wrap">{profile?.bio || 'No bio yet.'}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-zinc-200 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={cn('flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px]',
                activeTab === 'posts' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
              )}
            >
              <Grid className="w-3.5 h-3.5" /> Posts
            </button>
            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                className={cn('flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 -mb-[2px]',
                  activeTab === 'saved' ? 'border-black text-black' : 'border-transparent text-zinc-400 hover:text-black'
                )}
              >
                <Bookmark className="w-3.5 h-3.5" /> Saved
              </button>
            )}
          </div>

          {/* Posts Grid */}
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-zinc-100">
                <Camera className="w-14 h-14 text-zinc-200 mx-auto mb-3" />
                <p className="font-bold text-zinc-400">No Posts Yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 md:gap-3">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    whileHover={{ scale: 0.98 }}
                    className="aspect-square bg-zinc-100 rounded-xl overflow-hidden cursor-pointer border border-zinc-100 relative group"
                  >
                    {post.mediaType === 'VIDEO'
                      ? <video src={post.mediaUrl} className="w-full h-full object-cover" />
                      : <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Post" />
                    }
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                      <div className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{post.likeCount}</div>
                      <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{post.commentCount}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )
          )}

          {/* Saved Collections Tab */}
          {activeTab === 'saved' && (
            <div>
              {!selectedCollection ? (
                <>
                  {/* Collections Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* New Collection Button */}
                    <button
                      onClick={() => setShowNewCollectionModal(true)}
                      className="aspect-square bg-white border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-zinc-50 transition-all group"
                    >
                      <Plus className="w-8 h-8 text-zinc-300 group-hover:text-black transition-colors" />
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-black transition-colors">New Collection</span>
                    </button>

                    {collections.map(col => (
                      <div key={col.id} className="relative group">
                        <button
                          onClick={() => openCollection(col)}
                          className="w-full aspect-square bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-all relative"
                        >
                          {col.coverImageUrl ? (
                            <img src={col.coverImageUrl} className="w-full h-full object-cover" alt={col.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FolderOpen className="w-10 h-10 text-zinc-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-0 left-0 p-3">
                            <p className="text-white font-bold text-sm">{col.name}</p>
                            <p className="text-white/70 text-xs">{col.postCount} posts</p>
                          </div>
                        </button>
                        {col.name !== 'All Posts' && (
                          <button
                            onClick={() => deleteCollection(col.id)}
                            className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {collections.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-zinc-100 mt-4">
                      <Bookmark className="w-14 h-14 text-zinc-200 mx-auto mb-3" />
                      <p className="font-bold text-zinc-400">No saved posts yet</p>
                      <p className="text-zinc-300 text-sm mt-1">Bookmark posts to save them here</p>
                    </div>
                  )}
                </>
              ) : (
                /* Collection posts view */
                <div>
                  <div className="flex items-center gap-3 mb-5">
                    <button onClick={() => setSelectedCollection(null)} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-black">{selectedCollection.name}</h3>
                      <p className="text-xs text-zinc-400">{collectionPosts.length} posts</p>
                    </div>
                  </div>
                  {collectionPosts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-zinc-100">
                      <p className="text-zinc-400">No posts in this collection yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1 md:gap-3">
                      {collectionPosts.map(post => (
                        <motion.div key={post.id} whileHover={{ scale: 0.98 }}
                          className="aspect-square bg-zinc-100 rounded-xl overflow-hidden border border-zinc-100 relative group cursor-pointer">
                          {post.mediaType === 'VIDEO'
                            ? <video src={post.mediaUrl} className="w-full h-full object-cover" />
                            : <img src={post.mediaUrl} className="w-full h-full object-cover" alt="Saved Post" />
                          }
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold text-sm">
                            <div className="flex items-center gap-1"><Heart className="w-4 h-4 fill-white" />{post.likeCount}</div>
                            <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4 fill-white" />{post.commentCount}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Collection Modal */}
      <AnimatePresence>
        {showNewCollectionModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewCollectionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-4">New Collection</h3>
              <input
                type="text"
                placeholder="Collection name..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black mb-4"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createCollection()}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowNewCollectionModal(false)} className="flex-1 py-3 bg-zinc-100 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-colors">Cancel</button>
                <button onClick={createCollection} disabled={isCreating || !newCollectionName.trim()}
                  className="flex-1 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50">
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg mb-5">Edit Profile</h3>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-5">
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center border-4 border-white shadow-md cursor-pointer overflow-hidden relative group"
                >
                  {avatarPreview || profile?.avatarUrl ? (
                    <img src={avatarPreview || profile?.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">{profile?.username?.[0]?.toUpperCase()}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <p className="text-xs text-zinc-400 mt-2">Click to change photo</p>
              </div>

              {/* Bio */}
              <div className="mb-4">
                <label className="text-xs font-bold text-zinc-500 mb-1 block">BIO</label>
                <textarea
                  rows={4}
                  placeholder="Write your bio..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black resize-none"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowEditModal(false); setAvatarFile(null); setAvatarPreview(null); }}
                  className="flex-1 py-3 bg-zinc-100 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditProfile}
                  disabled={isSavingBio || isUploadingAvatar}
                  className="flex-1 py-3 bg-black text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isSavingBio || isUploadingAvatar ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Followers/Following Modal */}
      <AnimatePresence>
        {showFollowModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowFollowModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg capitalize">{showFollowModal}</h3>
                <button onClick={() => setShowFollowModal(null)}><X className="w-5 h-5 text-zinc-400 hover:text-black" /></button>
              </div>

              {isLoadingFollowList ? (
                <p className="text-center text-zinc-400 text-sm py-8">Loading...</p>
              ) : followError ? (
                <p className="text-center text-red-500 text-sm py-8">{followError}</p>
              ) : followList.length === 0 ? (
                <p className="text-center text-zinc-400 text-sm py-8">No {showFollowModal} yet.</p>
              ) : (
                <div className="overflow-y-auto space-y-4 flex-1 no-scrollbar">
                  {followList.map(u => (
                    <div key={u.username} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {u.avatarUrl ? <img src={u.avatarUrl} alt="avatar" className="w-full h-full object-cover rounded-full" /> : u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/${u.username}`} className="font-bold text-black text-sm hover:underline" onClick={() => setShowFollowModal(null)}>{u.username}</Link>
                          <p className="text-xs text-zinc-400 truncate max-w-[150px]">{u.bio || 'No bio'}</p>
                        </div>
                      </div>
                      {!isOwnProfile && (
                        <button 
                          className="text-xs font-bold text-blue-500 hover:text-blue-600"
                          onClick={async (e) => {
                            try {
                              await axiosInstance.post(`/users/${u.username}/follow`);
                              const btn = e.currentTarget;
                              btn.innerText = 'Following';
                              btn.className = 'text-xs font-bold text-zinc-400 cursor-not-allowed';
                            } catch (err) {
                              console.error('Failed to follow', err);
                            }
                          }}
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
