'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, ArrowRight } from 'lucide-react';

interface LocalLockProps {
  children: React.ReactNode;
}

export default function LocalLock({ children }: LocalLockProps) {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  // In a real app, this would be stored securely or use WebAuthn
  // For this demo, we'll use a default PIN "1234" or use WebAuthn if available
  const CORRECT_PIN = '1234';

  useEffect(() => {
    // Try to use browser's native biometrics/screen lock if available
    const tryWebAuthn = async () => {
      if (window.PublicKeyCredential) {
        try {
          // This triggers Windows Hello / TouchID / FaceID prompt!
          await navigator.credentials.get({
            publicKey: {
              challenge: crypto.getRandomValues(new Uint8Array(32)),
              userVerification: 'required',
              timeout: 60000,
            }
          });
          // If successful, unlock!
          setIsLocked(false);
        } catch (e) {
          console.log('WebAuthn failed or cancelled, falling back to PIN');
        }
      }
    };
    
    tryWebAuthn();
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === CORRECT_PIN) {
        setTimeout(() => setIsLocked(false), 300);
      } else {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  }, [pin]);

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Shield Icon */}
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-indigo-200/50">
          <Shield className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 mb-2">App Locked</h1>
        <p className="text-zinc-500 text-sm mb-8 text-center px-6">
          Use your device screen lock or enter your PIN to continue giving access.
        </p>

        {/* PIN Display */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                error 
                  ? 'border-red-500 bg-red-500 animate-shake' 
                  : pin.length > i 
                    ? 'border-indigo-600 bg-indigo-600' 
                    : 'border-zinc-300'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-xl font-bold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              {num}
            </button>
          ))}
          <div /> {/* Empty space */}
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-xl font-bold text-zinc-800 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            Del
          </button>
        </div>

        {/* Footer */}
        <div className="text-xs text-zinc-400">
          Default PIN is 1234 for demo
        </div>
      </div>
    </div>
  );
}
