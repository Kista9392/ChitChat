'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Key, Lock, ArrowRight, Camera, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      await axiosInstance.post('/auth/reset-password', { email, otp, newPassword });
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMsg = typeof errorData === 'object' && errorData.message 
        ? errorData.message 
        : (typeof errorData === 'string' ? errorData : 'Failed to reset password. Check your OTP.');
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-10 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <Camera className="w-10 h-10 text-black dark:text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-black dark:text-white tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Check your email for the 6-digit OTP.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 dark:bg-emerald-950/20 border border-green-100 dark:border-emerald-900/30 text-green-600 dark:text-emerald-400 p-3 rounded-xl text-sm text-center">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                required
                maxLength={6}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black dark:focus:border-white transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 tracking-widest font-bold"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black dark:focus:border-white transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-4 px-4 bg-black dark:bg-indigo-600 text-white font-bold rounded-2xl hover:bg-zinc-800 dark:hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
