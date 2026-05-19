'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { Image as ImageIcon, Send, ArrowLeft, Camera, Film, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatePostPage() {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState('IMAGE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMediaType(file.type.startsWith('video') ? 'VIDEO' : 'IMAGE');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('content', content);
      formData.append('mediaType', mediaType);

      await axiosInstance.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart_form_data' }
      });
      router.push('/');
    } catch (err) {
      console.error('Failed to create post', err);
      alert('Failed to create post. Make sure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <main className="pl-20 xl:pl-64 min-h-screen bg-zinc-50/30 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-3xl border border-zinc-200 shadow-xl overflow-hidden"
        >
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <button onClick={() => router.back()} className="text-zinc-500 hover:text-black">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-lg">Create New Post</h1>
            <div className="w-6" />
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square w-full bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-zinc-100 transition-colors"
            >
              {previewUrl ? (
                <>
                  {mediaType === 'VIDEO' ? (
                    <video src={previewUrl} className="w-full h-full object-cover" autoPlay muted loop />
                  ) : (
                    <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  )}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-zinc-500" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-black font-bold">Select photos or videos</p>
                    <p className="text-zinc-400 text-sm">Drag and drop or click to browse</p>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*,video/*"
              />
            </div>

            <div className="space-y-1">
              <textarea
                placeholder="Write a caption..."
                rows={4}
                className="w-full bg-zinc-50 border border-zinc-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none font-medium text-black"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <p className="text-xs text-zinc-400 flex items-center gap-1 pl-1">
                <span>😊</span> Press <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] font-mono">Win</kbd> + <kbd className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-[10px] font-mono">.</kbd> to open emoji keyboard
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="w-full py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:bg-zinc-200 shadow-lg shadow-black/5"
            >
              {isSubmitting ? 'Posting...' : 'Share Post'}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
