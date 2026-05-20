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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-zinc-100 rounded-2xl">
              <Camera className="w-10 h-10 text-black" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-black tracking-tight">Reset Password</h2>
          <p className="mt-2 text-sm text-zinc-500">Check your email for the 6-digit OTP.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-100 text-green-600 p-3 rounded-xl text-sm text-center">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-black transition-colors" />
              <input
                type="text"
                required
                maxLength={6}
                className="w-full bg-zinc-50 border border-zinc-200 text-black pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-black transition-all placeholder:text-zinc-400 tracking-widest font-bold"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-black transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full bg-zinc-50 border border-zinc-200 text-black pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-black transition-all placeholder:text-zinc-400"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-4 px-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50"
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
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordPageInner />
    </Suspense>
  );
}
