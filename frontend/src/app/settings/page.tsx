'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { Settings as SettingsIcon, LogOut, Shield, Bell, Moon, User, Lock, Check, AlertCircle, EyeOff, Eye, UserX, Trash2, Globe, BarChart2, Clock, Calendar, Heart, X, Film, Menu, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TabType = 'account' | 'security' | 'privacy' | 'notifications' | 'display' | 'activity' | 'more';

export default function SettingsPage() {
  const { logout, user, darkMode, toggleDarkMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  
  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Bio state
  const [bio, setBio] = useState('');
  const [isUpdatingBio, setIsUpdatingBio] = useState(false);

  // Toggle states

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [showActivity, setShowActivity] = useState(true);

  // Activity data
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const [notInterestedPosts, setNotInterestedPosts] = useState([
    { id: '1', title: 'Funny Dog Video', type: 'VIDEO', mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: '2', title: 'Makeup Tutorial', type: 'VIDEO', mediaUrl: 'https://www.w3schools.com/html/movie.mp4' },
    { id: '3', title: 'Coding Meme', type: 'IMAGE', mediaUrl: 'https://picsum.photos/400/400' },
  ]);
  const [selectedPostForView, setSelectedPostForView] = useState<{ mediaUrl: string, mediaType: string, title?: string } | null>(null);  // More data
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [bugReport, setBugReport] = useState('');
  const [reportStatus, setReportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [userSuggestion, setUserSuggestion] = useState('');
  const [suggestionStatus, setSuggestionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'more') {
      fetchSuggestions();
    }
  }, [activeTab]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    try {
      const res = await axiosInstance.get('/users/suggestions');
      setSuggestions(res.data);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugReport.trim()) return;
    setReportStatus({ type: 'success', message: 'Report submitted successfully! Thank you.' });
    setBugReport('');
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSuggestion.trim()) return;
    try {
      await axiosInstance.post('/suggestions', { content: userSuggestion });
      setSuggestionStatus({ type: 'success', message: 'Suggestion submitted successfully! We appreciate your feedback.' });
      setUserSuggestion('');
    } catch (err) {
      console.error('Failed to submit suggestion', err);
      setSuggestionStatus({ type: 'error', message: 'Failed to submit suggestion. Please try again.' });
    }
  };

  useEffect(() => {
    if (user) {
      setShowActivity(user.showActivityStatus ?? true);
      setPushNotifications(user.pushNotificationsEnabled ?? true);
      setEmailNotifications(user.emailNotificationsEnabled ?? false);
      setIsPrivateAccount(user.isPrivateAccount ?? false);
      setBio(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchLikedPosts();
    }
  }, [activeTab]);

  const fetchLikedPosts = async () => {
    setIsLoadingLiked(true);
    try {
      const res = await axiosInstance.get('/posts/liked');
      setLikedPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch liked posts', err);
    } finally {
      setIsLoadingLiked(false);
    }
  };

  const handleUnlike = async (postId: string) => {
    try {
      await axiosInstance.post(`/posts/${postId}/like`);
      setLikedPosts(likedPosts.filter(post => post.id !== postId));
    } catch (err) {
      console.error('Failed to unlike post', err);
    }
  };

  const handleRemoveNotInterested = (id: string) => {
    setNotInterestedPosts(notInterestedPosts.filter(post => post.id !== id));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await axiosInstance.put('/users/me/password', { oldPassword, newPassword });
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ 
        type: 'error', 
        message: err?.response?.data || 'Failed to update password. Check your current password.' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleActivity = async (val: boolean) => {
    setShowActivity(val);
    try {
      await axiosInstance.put('/users/me/activity-status', { status: val });
    } catch (err) {
      console.error('Failed to update activity status', err);
    }
  };

  const handleTogglePushNotifications = async (val: boolean) => {
    setPushNotifications(val);
    try {
      await axiosInstance.put('/users/me/settings', { pushNotifications: val, emailNotifications: emailNotifications });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const handleToggleEmailNotifications = async (val: boolean) => {
    setEmailNotifications(val);
    try {
      await axiosInstance.put('/users/me/settings', { pushNotifications: pushNotifications, emailNotifications: val });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const handleTogglePrivateAccount = async (val: boolean) => {
    setIsPrivateAccount(val);
    try {
      await axiosInstance.put('/users/me/settings', { isPrivateAccount: val });
    } catch (err) {
      console.error('Failed to update settings', err);
    }
  };

  const handleUpdateBio = async () => {
    setIsUpdatingBio(true);
    try {
      await axiosInstance.put('/users/me', { bio });
      alert('Bio updated successfully!');
    } catch (err) {
      console.error('Failed to update bio', err);
      alert('Failed to update bio');
    } finally {
      setIsUpdatingBio(false);
    }
  };

  const handleFollowSuggestion = async (username: string) => {
    try {
      await axiosInstance.post(`/users/${username}/follow`);
      setSuggestions(suggestions.filter(u => u.username !== username));
    } catch (err) {
      console.error('Failed to follow', err);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;
    try {
      await axiosInstance.delete('/users/me');
      logout();
    } catch (err) {
      console.error('Failed to delete account', err);
      alert('Failed to delete account');
    }
  };

  const tabs = [
    { id: 'account', icon: <User className="w-5 h-5" />, title: 'Account Info' },
    { id: 'privacy', icon: <EyeOff className="w-5 h-5" />, title: 'Privacy' },
    { id: 'security', icon: <Shield className="w-5 h-5" />, title: 'Security' },
    { id: 'notifications', icon: <Bell className="w-5 h-5" />, title: 'Notifications' },
    { id: 'activity', icon: <BarChart2 className="w-5 h-5" />, title: 'My Activity' },
    { id: 'display', icon: <Moon className="w-5 h-5" />, title: 'Display' },
    { id: 'more', icon: <Menu className="w-5 h-5" />, title: 'More' },
  ];

  const Toggle = ({ enabled, setEnabled }: { enabled: boolean, setEnabled: (val: boolean) => void }) => (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
        enabled ? "bg-black" : "bg-zinc-200"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="pl-0 md:pl-20 xl:pl-64 pb-16 md:pb-0 min-h-screen bg-zinc-50/30 dark:bg-zinc-950">
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black dark:text-white">Settings</h1>
              <p className="text-sm text-zinc-400">Manage your account and app preferences</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column: Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-2 space-y-1 shadow-sm">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      activeTab === tab.id
                        ? "bg-black text-white shadow-md"
                        : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"
                    )}
                  >
                    {tab.icon}
                    {tab.title}
                  </button>
                ))}
                
                <div className="border-t border-zinc-100 my-2 pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Content */}
            <div className="flex-1">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm min-h-[450px]">
                
                {/* Account Info Tab */}
                {activeTab === 'account' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <User className="w-5 h-5 text-black" />
                      <h2 className="font-bold text-lg text-black">Account Information</h2>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Username</label>
                        <input
                          type="text"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed"
                          value={user?.username || ''}
                          disabled
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Email Address</label>
                        <input
                          type="email"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed"
                          value={user?.email || ''}
                          disabled
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Bio</label>
                        <textarea
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                      
                      <button
                        onClick={handleUpdateBio}
                        disabled={isUpdatingBio}
                        className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {isUpdatingBio ? 'Saving...' : 'Save Bio'}
                      </button>

                      <div className="border-t border-zinc-100 mt-6 pt-6">
                        <h3 className="text-sm font-bold text-red-500 mb-2">Danger Zone</h3>
                        <button 
                          onClick={handleDeleteAccount}
                          className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <EyeOff className="w-5 h-5 text-black" />
                      <h2 className="font-bold text-lg text-black">Account Privacy</h2>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div>
                          <p className="font-bold text-sm text-black">Private Account</p>
                          <p className="text-xs text-zinc-400">Only approved accounts can see your posts.</p>
                        </div>
                        <Toggle enabled={isPrivateAccount} setEnabled={handleTogglePrivateAccount} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div>
                          <p className="font-bold text-sm text-black">Show Activity Status</p>
                          <p className="text-xs text-zinc-400">Allow accounts you follow to see when you were last active.</p>
                        </div>
                        <Toggle enabled={showActivity} setEnabled={handleToggleActivity} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <Lock className="w-5 h-5 text-black" />
                      <h2 className="font-bold text-lg text-black">Change Password</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Current Password</label>
                        <input
                          type="password"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">New Password</label>
                        <input
                          type="password"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-500 mb-1 block uppercase">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      <AnimatePresence>
                        {passwordStatus && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-xl text-sm font-medium",
                              passwordStatus.type === 'success' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                            )}
                          >
                            {passwordStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {passwordStatus.message}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <Bell className="w-5 h-5 text-black" />
                      <h2 className="font-bold text-lg text-black">Notification Settings</h2>
                    </div>

                    <div className="space-y-3 max-w-md">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div>
                          <p className="font-bold text-sm text-black">Push Notifications</p>
                          <p className="text-xs text-zinc-400">Get instant alerts on your device</p>
                        </div>
                        <Toggle enabled={pushNotifications} setEnabled={handleTogglePushNotifications} />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <div>
                          <p className="font-bold text-sm text-black">Email Notifications</p>
                          <p className="text-xs text-zinc-400">Receive digests and updates</p>
                        </div>
                        <Toggle enabled={emailNotifications} setEnabled={handleToggleEmailNotifications} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <BarChart2 className="w-5 h-5 text-black" />
                      <h2 className="font-bold text-lg text-black">My Activity</h2>
                    </div>

                    <div className="space-y-6">
                      {/* Liked Reels/Posts */}
                      <div>
                        <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          Liked Posts & Reels
                        </h3>
                        {isLoadingLiked ? (
                          <div className="text-sm text-zinc-400">Loading liked posts...</div>
                        ) : likedPosts.length === 0 ? (
                          <div className="text-sm text-zinc-400 p-4 bg-zinc-50 rounded-xl border border-zinc-100">You haven't liked any posts yet.</div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {likedPosts.map((post) => (
                              <div key={post.id} className="relative group bg-zinc-100 rounded-xl overflow-hidden aspect-square">
                                {post.mediaUrl ? (
                                  post.mediaType === 'VIDEO' ? (
                                    <video src={post.mediaUrl} className="w-full h-full object-cover" preload="metadata" muted />
                                  ) : (
                                    <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400 p-2">
                                    {post.content?.substring(0, 30)}...
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                  <button 
                                    onClick={() => setSelectedPostForView({ mediaUrl: post.mediaUrl, mediaType: post.mediaType })}
                                    className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleUnlike(post.id)}
                                    className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"
                                    title="Unlike"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Not Interested */}
                      <div className="border-t border-zinc-100 pt-6">
                        <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
                          <EyeOff className="w-4 h-4 text-zinc-500" />
                          Not Interested
                        </h3>
                        <p className="text-xs text-zinc-400 mb-3">Posts you've marked as not interested will appear here. You can remove them to see them again.</p>
                        
                        <div className="space-y-2">
                          {notInterestedPosts.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                              <div className="flex items-center gap-3">
                                {item.type === 'VIDEO' ? <Film className="w-4 h-4 text-zinc-400" /> : <Globe className="w-4 h-4 text-zinc-400" />}
                                <span className="text-sm font-medium text-black">{item.title}</span>
                              </div>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => setSelectedPostForView({ mediaUrl: item.mediaUrl, mediaType: item.type, title: item.title })}
                                    className="p-1.5 hover:bg-zinc-200 rounded-full transition-colors"
                                    title="View"
                                  >
                                    <Eye className="w-4 h-4 text-zinc-500" />
                                  </button>
                                  <button 
                                    onClick={() => handleRemoveNotInterested(item.id)}
                                    className="p-1.5 hover:bg-zinc-200 rounded-full transition-colors"
                                    title="Remove"
                                  >
                                    <X className="w-4 h-4 text-zinc-500" />
                                  </button>
                                </div>
                            </div>
                          ))}
                          {notInterestedPosts.length === 0 && (
                            <div className="text-sm text-zinc-400 p-4 bg-zinc-50 rounded-xl border border-zinc-100">No items marked as not interested.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}



                {/* Display Tab */}
                {activeTab === 'display' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <Moon className="w-5 h-5 text-black dark:text-white" />
                      <h2 className="font-bold text-lg text-black dark:text-white">Display Preferences</h2>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                        <div>
                          <p className="font-bold text-sm text-black dark:text-white">Dark Mode</p>
                          <p className="text-xs text-zinc-400">Reduce eye strain in low light</p>
                        </div>
                        <Toggle enabled={darkMode} setEnabled={toggleDarkMode} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* More Tab */}
                {activeTab === 'more' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center gap-3 mb-6">
                      <Menu className="w-5 h-5 text-black" />
                      <h2 className="font-bold text-lg text-black">More Options</h2>
                    </div>

                    <div className="space-y-8 max-w-2xl">
                      {/* User Suggestions */}
                      <div>
                        <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          Suggested for You
                        </h3>
                        <p className="text-xs text-zinc-400 mb-3">Accounts you might want to follow.</p>
                        
                        {isLoadingSuggestions ? (
                          <div className="text-sm text-zinc-400">Loading suggestions...</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {suggestions.map((u) => (
                              <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
                                    {u.avatarUrl ? (
                                      <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-6 h-6 text-zinc-400 m-2" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-black">{u.username}</p>
                                    <p className="text-xs text-zinc-400">{u.followersCount} followers</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleFollowSuggestion(u.username)}
                                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                  Follow
                                </button>
                              </div>
                            ))}
                            {suggestions.length === 0 && (
                              <div className="text-sm text-zinc-400">No suggestions available.</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Feature Suggestions */}
                      <div className="border-t border-zinc-100 pt-6">
                        <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
                          <PlusSquare className="w-4 h-4 text-zinc-500" />
                          Feature Suggestions
                        </h3>
                        <p className="text-xs text-zinc-400 mb-3">Have an idea for a new feature? Let us know!</p>
                        
                        <form onSubmit={handleSendSuggestion} className="space-y-4">
                          <textarea
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all h-32"
                            placeholder="Describe your suggestion here..."
                            value={userSuggestion}
                            onChange={(e) => setUserSuggestion(e.target.value)}
                            required
                          />
                          <button
                            type="submit"
                            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                          >
                            Submit Suggestion
                          </button>
                        </form>
                        
                        {suggestionStatus && (
                          <div className={cn(
                            "mt-3 text-sm p-3 rounded-xl flex items-center gap-2",
                            suggestionStatus.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {suggestionStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {suggestionStatus.message}
                          </div>
                        )}
                      </div>

                      {/* Bug Reports & Complaints */}
                      <div className="border-t border-zinc-100 pt-6">
                        <h3 className="font-bold text-sm text-black mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-zinc-500" />
                          Bug Reports & Complaints
                        </h3>
                        <p className="text-xs text-zinc-400 mb-3">Found a bug or have a complaint? Let us know.</p>
                        
                        <form onSubmit={handleSendReport} className="space-y-4">
                          <textarea
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all h-32"
                            placeholder="Describe the issue or complaint here..."
                            value={bugReport}
                            onChange={(e) => setBugReport(e.target.value)}
                            required
                          />
                          <button
                            type="submit"
                            className="bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors"
                          >
                            Submit Report
                          </button>
                        </form>
                        
                        {reportStatus && (
                          <div className={cn(
                            "mt-3 text-sm p-3 rounded-xl flex items-center gap-2",
                            reportStatus.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {reportStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {reportStatus.message}
                          </div>
                        )}
                      </div>

                      {/* Contact Us */}
                      <div className="border-t border-zinc-100 pt-6">
                        <h3 className="font-bold text-sm text-black mb-3">Contact Us</h3>
                        <p className="text-xs text-zinc-400 mb-3">For any queries, reach out to us at support@chitchat.com</p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </div>
            </div>
          </div>

        </div>
      </main>
      {/* Modal for Viewing Post/Reel */}
      <AnimatePresence>
        {selectedPostForView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPostForView(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden max-w-lg w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()} // Prevent closing on click inside
            >
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-bold text-black dark:text-white">
                  {selectedPostForView.title || 'View Post'}
                </h3>
                <button 
                  onClick={() => setSelectedPostForView(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                {selectedPostForView.mediaType === 'VIDEO' ? (
                  <video 
                    src={selectedPostForView.mediaUrl} 
                    controls 
                    autoPlay 
                    className="max-h-[60vh] rounded-lg"
                  />
                ) : (
                  <img 
                    src={selectedPostForView.mediaUrl} 
                    alt="" 
                    className="max-h-[60vh] rounded-lg object-contain"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
