'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';
import { safeStorage } from '@/lib/storage';

import { Settings as SettingsIcon, LogOut, Shield, Bell, Moon, User, Lock, Check, AlertCircle, EyeOff, Eye, UserX, Trash2, Globe, BarChart2, Clock, Calendar, Heart, X, Film, Menu, PlusSquare, ChevronDown } from 'lucide-react';
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
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check if the prompt was already captured globally
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
      setIsInstallable(true);
    }

    // 2. Listen to future prompt captures
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // 3. Listen to our custom event dispatched by AuthContext (in case it captures it during navigation)
    const handlePwaInstallable = (e: any) => {
      if (e.detail) {
        setDeferredPrompt(e.detail);
        setIsInstallable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-installable', handlePwaInstallable);

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    } else {
      setIsInstallable('serviceWorker' in navigator || !!(window as any).deferredPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-installable', handlePwaInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPrompt : null);
    if (!promptEvent) {
      setShowInstallGuide(true);
      return;
    }
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`User response to secure install prompt: ${outcome}`);
    } catch (err) {
      console.error('Failed to trigger secure PWA install', err);
    }
    setDeferredPrompt(null);
    if (typeof window !== 'undefined') {
      (window as any).deferredPrompt = null;
    }
    setIsInstallable(false);
  };

  // Full profile data fetched from API (includes email, createdAt)
  const [fullProfile, setFullProfile] = useState<{ email: string; createdAt: string } | null>(null);

  useEffect(() => {
    if (activeTab === 'more') {
      fetchSuggestions();
    }
  }, [activeTab]);

  // Fetch full profile when user is loaded (for email + createdAt)
  useEffect(() => {
    if (user?.username) {
      axiosInstance.get(`/users/${user.username}`)
        .then(res => {
          // The backend now returns email via a separate endpoint; use /auth/me if available
          // For now, we call the user profile which includes createdAt
          setFullProfile({
            email: res.data.email || user?.email || '',
            createdAt: res.data.createdAt || ''
          });
        })
        .catch(err => console.error('Failed to fetch full profile', err));
    }
  }, [user?.username]);

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
    try {
      await axiosInstance.post('/suggestions/bug', { content: bugReport.trim() });
      setReportStatus({ type: 'success', message: 'Bug report securely sent directly to your developer email! Thank you.' });
      setBugReport('');
    } catch (err) {
      console.error('Failed to submit bug report', err);
      setReportStatus({ type: 'error', message: 'Failed to submit bug report securely. Please try again.' });
    }
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
    axiosInstance.get('/users/me/settings')
      .then(res => {
        setPushNotifications(res.data.pushNotifications !== false);
        setEmailNotifications(res.data.emailNotifications === true);
        setIsPrivateAccount(res.data.isPrivateAccount === true);
        safeStorage.setItem('pushNotificationsEnabled', (res.data.pushNotifications !== false).toString());
      })
      .catch(err => console.error('Failed to fetch settings from backend', err));
  }, []);


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
    safeStorage.setItem('pushNotificationsEnabled', val.toString());
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
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900",
        enabled ? "bg-black dark:bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"
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

  const renderAccountInfo = () => (
    <div className="space-y-4 max-w-md">
      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 block uppercase">Username</label>
        <input
          type="text"
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
          value={user?.username || ''}
          disabled
        />
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 block uppercase">Email Address</label>
        <input
          type="email"
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
          value={fullProfile?.email || user?.email || 'Loading...'}
          disabled
        />
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 block uppercase">Member Since</label>
        <input
          type="text"
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
          value={fullProfile?.createdAt ? new Date(fullProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Loading...'}
          disabled
        />
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="font-bold text-sm text-black dark:text-white">Private Account</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Only approved accounts can see your posts.</p>
        </div>
        <Toggle enabled={isPrivateAccount} setEnabled={handleTogglePrivateAccount} />
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="font-bold text-sm text-black dark:text-white">Show Activity Status</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Allow accounts you follow to see when you were last active.</p>
        </div>
        <Toggle enabled={showActivity} setEnabled={handleToggleActivity} />
      </div>
    </div>
  );

  const renderSecurity = () => (
    <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 block uppercase">Current Password</label>
        <input
          type="password"
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-white transition-all"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 block uppercase">New Password</label>
        <input
          type="password"
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-white transition-all"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 block uppercase">Confirm New Password</label>
        <input
          type="password"
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-white transition-all"
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
              passwordStatus.type === 'success' ? "bg-green-50 dark:bg-emerald-950/20 text-green-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
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
        className="px-6 py-3 bg-black dark:bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {isChangingPassword ? 'Updating...' : 'Update Password'}
      </button>
    </form>
  );

  const renderNotifications = () => (
    <div className="space-y-3 max-w-md">
      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="font-bold text-sm text-black dark:text-white">Push Notifications</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Get instant alerts on your device</p>
        </div>
        <Toggle enabled={pushNotifications} setEnabled={handleTogglePushNotifications} />
      </div>

      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="font-bold text-sm text-black dark:text-white">Email Notifications</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">Receive digests and updates</p>
        </div>
        <Toggle enabled={emailNotifications} setEnabled={handleToggleEmailNotifications} />
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      {/* Liked Reels/Posts */}
      <div>
        <h3 className="font-bold text-sm text-black dark:text-white mb-3 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Liked Posts & Reels
        </h3>
        {isLoadingLiked ? (
          <div className="text-sm text-zinc-400">Loading liked posts...</div>
        ) : likedPosts.length === 0 ? (
          <div className="text-sm text-zinc-400 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">You haven't liked any posts yet.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {likedPosts.map((post) => (
              <div key={post.id} className="relative group bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden aspect-square">
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
                    className="p-2 bg-white dark:bg-zinc-800 rounded-full text-black dark:text-white hover:scale-110 transition-transform"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleUnlike(post.id)}
                    className="p-2 bg-white dark:bg-zinc-800 rounded-full text-red-500 hover:scale-110 transition-transform"
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
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <h3 className="font-bold text-sm text-black dark:text-white mb-3 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-zinc-500" />
          Not Interested
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Posts you've marked as not interested will appear here. You can remove them to see them again.</p>
        
        <div className="space-y-2">
          {notInterestedPosts.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                {item.type === 'VIDEO' ? <Film className="w-4 h-4 text-zinc-400" /> : <Globe className="w-4 h-4 text-zinc-400" />}
                <span className="text-sm font-medium text-black dark:text-white">{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedPostForView({ mediaUrl: item.mediaUrl, mediaType: item.type, title: item.title })}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  title="View"
                >
                  <Eye className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                </button>
                <button 
                  onClick={() => handleRemoveNotInterested(item.id)}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                  title="Remove"
                >
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>
            </div>
          ))}
          {notInterestedPosts.length === 0 && (
            <div className="text-sm text-zinc-400 p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">No items marked as not interested.</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDisplay = () => (
    <div className="space-y-4 max-w-md">
      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
        <div>
          <p className="font-bold text-sm text-black dark:text-white">Dark Mode</p>
          <p className="text-xs text-zinc-400">Reduce eye strain in low light</p>
        </div>
        <Toggle enabled={darkMode} setEnabled={toggleDarkMode} />
      </div>
    </div>
  );

  const renderMore = () => (
    <div className="space-y-8 max-w-2xl">
      {/* User Suggestions */}
      <div>
        <h3 className="font-bold text-sm text-black dark:text-white mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-500" />
          Suggested for You
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Accounts you might want to follow.</p>
        
        {isLoadingSuggestions ? (
          <div className="text-sm text-zinc-400">Loading suggestions...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((u) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-400 m-2" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white">{u.username}</p>
                    <p className="text-xs text-zinc-400">{u.followersCount} followers</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleFollowSuggestion(u.username)}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  Follow
                </button>
              </div>
            ))}
            {suggestions.length === 0 && (
              <div className="text-sm text-zinc-400 dark:text-zinc-500">No suggestions available.</div>
            )}
          </div>
        )}
      </div>

      {/* Feature Suggestions */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <h3 className="font-bold text-sm text-black dark:text-white mb-3 flex items-center gap-2">
          <PlusSquare className="w-4 h-4 text-zinc-500" />
          Feature Suggestions
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Have an idea for a new feature? Let us know!</p>
        
        <form onSubmit={handleSendSuggestion} className="space-y-4">
          <textarea
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-white transition-all h-32"
            placeholder="Describe your suggestion here..."
            value={userSuggestion}
            onChange={(e) => setUserSuggestion(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-black dark:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-indigo-700 transition-colors"
          >
            Submit Suggestion
          </button>
        </form>
        
        {suggestionStatus && (
          <div className={cn(
            "mt-3 text-sm p-3 rounded-xl flex items-center gap-2 border",
            suggestionStatus.type === 'success' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30"
          )}>
            {suggestionStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {suggestionStatus.message}
          </div>
        )}
      </div>

      {/* Bug Reports & Complaints */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <h3 className="font-bold text-sm text-black dark:text-white mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-zinc-500" />
          Bug Reports & Complaints
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">Found a bug or have a complaint? Let us know.</p>
        
        <form onSubmit={handleSendReport} className="space-y-4">
          <textarea
            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10 focus:border-black dark:focus:border-white transition-all h-32"
            placeholder="Describe the issue or complaint here..."
            value={bugReport}
            onChange={(e) => setBugReport(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-black dark:bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 dark:hover:bg-indigo-700 transition-colors"
          >
            Submit Report
          </button>
        </form>
        
        {reportStatus && (
          <div className={cn(
            "mt-3 text-sm p-3 rounded-xl flex items-center gap-2 border",
            reportStatus.type === 'success' ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30"
          )}>
            {reportStatus.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {reportStatus.message}
          </div>
        )}
      </div>

      {/* Secure PWA App Installation */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-2xl border border-indigo-100/50 dark:border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-indigo-950 dark:text-indigo-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500 animate-pulse" />
              Install Drift App
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Install Drift on your home screen for full background thread notifications. Safe, sandboxed, and respects your data privacy.
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap self-start md:self-center cursor-pointer"
          >
            <PlusSquare className="w-4 h-4" />
            Install Drift App
          </button>
        </div>
      </div>

      {/* Contact Us */}
      <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <h3 className="font-bold text-sm text-black dark:text-white mb-3">Contact Us</h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">For any queries, reach out to us at support@drift.social</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Sidebar />
      <motion.main 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ willChange: 'transform, opacity' }}
        className="pl-0 md:pl-20 xl:pl-64 pb-28 md:pb-8 min-h-screen bg-zinc-50/30 dark:bg-zinc-950"
      >
        <div className="max-w-5xl mx-auto p-4 md:p-10">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-black dark:bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black dark:text-white">Settings</h1>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Manage your account and app preferences</p>
            </div>
          </div>

          {/* Desktop Responsive Split-Column Side View Layout */}
          <div className="hidden md:flex flex-row gap-6">
            {/* Left Column: Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-2 space-y-1 shadow-sm flex flex-col gap-1 w-full">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap w-full",
                      activeTab === tab.id
                        ? "bg-black dark:bg-indigo-600 text-white shadow-md"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white"
                    )}
                  >
                    {tab.icon}
                    {tab.title}
                  </button>
                ))}
                
                <div className="border-t border-zinc-100 dark:border-zinc-800 my-2 pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Log Out
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Content Card */}
            <div className="flex-1">
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm min-h-[450px]">
                {activeTab === 'account' && renderAccountInfo()}
                {activeTab === 'privacy' && renderPrivacy()}
                {activeTab === 'security' && renderSecurity()}
                {activeTab === 'notifications' && renderNotifications()}
                {activeTab === 'activity' && renderActivity()}
                {activeTab === 'display' && renderDisplay()}
                {activeTab === 'more' && renderMore()}
              </div>
            </div>
          </div>

          {/* Mobile Accordion Dropdown Layout */}
          <div className="flex flex-col md:hidden space-y-3">
            {tabs.map((tab) => {
              const isExpanded = activeTab === tab.id;
              return (
                <div key={tab.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setActiveTab(isExpanded ? null : tab.id as TabType)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-all text-left",
                      isExpanded ? "bg-zinc-50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 text-black dark:text-white" : "text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {tab.icon}
                      {tab.title}
                    </div>
                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                          {tab.id === 'account' && renderAccountInfo()}
                          {tab.id === 'privacy' && renderPrivacy()}
                          {tab.id === 'security' && renderSecurity()}
                          {tab.id === 'notifications' && renderNotifications()}
                          {tab.id === 'activity' && renderActivity()}
                          {tab.id === 'display' && renderDisplay()}
                          {tab.id === 'more' && renderMore()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            
            {/* Mobile Log Out Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-red-50 dark:bg-red-950/20 border border-red-100/10 text-red-500 font-bold rounded-2xl text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Log Out
            </button>
          </div>

        </div>
      </motion.main>
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

      {/* Custom PWA Install Guide Modal */}
      <AnimatePresence>
        {showInstallGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={() => setShowInstallGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowInstallGuide(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
                
                <h3 className="text-xl font-black text-black dark:text-white tracking-tight">
                  Install Drift App
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 px-2 leading-relaxed">
                  To securely install Drift on your device, follow these quick steps:
                </p>
              </div>

              {/* Step list based on device */}
              <div className="mt-6 space-y-4">
                {isIOS ? (
                  <>
                    <div className="flex items-start gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        1
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-black dark:text-white">Tap Share Button</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                          Tap the Share icon <span className="inline-block px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded mx-0.5">
                            <svg className="w-3.5 h-3.5 inline text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </span> in your Safari browser navigation bar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        2
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-black dark:text-white">Add to Home Screen</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                          Scroll down the options menu and select <strong className="text-black dark:text-white">"Add to Home Screen"</strong>.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        1
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-black dark:text-white">Open Browser Menu</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                          Tap your browser's menu (three dots <span className="font-bold">⋮</span> in top-right or browser icon).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/50 rounded-2xl">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        2
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-black dark:text-white">Install App</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">
                          Select <strong className="text-black dark:text-white">"Install App"</strong> or <strong className="text-black dark:text-white">"Add to Home Screen"</strong>.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowInstallGuide(false)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
