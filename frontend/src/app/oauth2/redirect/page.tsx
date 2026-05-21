'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function OAuth2RedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const username = searchParams.get('username');
    const errorParam = searchParams.get('error');

    // Next.js App Router hydration check: wait until search params are populated on the client
    if (typeof window !== 'undefined' && window.location.search && !accessToken && !refreshToken && !username && !errorParam) {
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    if (errorParam === 'not_registered') {
      setError('You have not registered yet using this email.');
    } else if (accessToken && refreshToken && username) {
      login(accessToken, refreshToken, username);
    } else {
      setError('Missing tokens or username in redirect URL.');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, login, router]);

  if (error) {
    const isNotRegistered = error.includes('not registered');
    const email = searchParams.get('email');

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border border-red-100 text-red-500 p-6 rounded-3xl max-w-sm text-center">
          <h2 className="font-bold text-lg mb-2">Auth Error</h2>
          <p className="text-sm">{error}</p>
          {isNotRegistered ? (
            <button 
              onClick={() => router.push(`/register?email=${email}`)}
              className="mt-4 w-full bg-black text-white py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              Sign Up Now
            </button>
          ) : (
            <p className="text-xs mt-4 text-zinc-400">Redirecting to login...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold text-black tracking-tighter italic">Syncing with Google...</h2>
    </div>
  );
}

export default function OAuth2Redirect() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" /></div>}>
      <OAuth2RedirectInner />
    </Suspense>
  );
}
