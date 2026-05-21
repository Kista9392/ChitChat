'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axios';
import { Mail, ArrowLeft, ArrowRight, Camera } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      await axiosInstance.post('/auth/forgot-password', { email });
      setMessage('OTP has been sent to your email. Redirecting...');
      setTimeout(() => {
        router.push(`/reset-password?email=${email}`);
      }, 2000);
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMsg = typeof errorData === 'object' && errorData.message 
        ? errorData.message 
        : (typeof errorData === 'string' ? errorData : 'Failed to send OTP. Check your email.');
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
          <h2 className="mt-6 text-3xl font-extrabold text-black dark:text-white tracking-tight">Forgot Password?</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">We'll send a 6-digit OTP to your email.</p>
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

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="email"
              required
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-black dark:text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-black dark:focus:border-white transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-4 px-4 bg-black dark:bg-indigo-600 text-white font-bold rounded-2xl hover:bg-zinc-800 dark:hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg"
          >
            {isSubmitting ? 'Sending...' : 'Send OTP'}
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
