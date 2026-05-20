'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import axiosInstance from '@/lib/axios';
import { Send, Search, MessageCircle, Check, CheckCheck, SmilePlus, Camera, Mic, Play, X } from 'lucide-react';
import Link from 'next/link';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

interface Message {
  id: string;
  senderUsername: string;
  receiverUsername: string;
  content: string;
  createdAt: string;
  readAt?: string;
  mediaUrl?: string;
  messageType?: string;
}

interface Contact {
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
  showActivityStatus?: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const stompClient = useRef<Client | null>(null);
  const searchParams = useSearchParams();
  const userParam = searchParams.get('user');

  useEffect(() => {
    if (userParam) {
      setSelectedUser(userParam);
      setContacts(prev => {
        if (!prev.find(c => c.username === userParam)) {
          return [{ username: userParam }, ...prev];
        }
        return prev;
      });
    }
  }, [userParam]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedUserRef = useRef<string | null>(null);

  // Keep a ref in sync so the STOMP callback always has the latest selectedUser
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch contacts (users you follow)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.username) return;
      try {
        const res = await axiosInstance.get(`/users/${user.username}/following`);
        setContacts(res.data);
        setFilteredContacts(res.data);
      } catch (err) {
        console.error('Failed to fetch contacts', err);
      }
    };
    fetchContacts();
  }, [user?.username]);

  // Poll contacts in background every 20 seconds to keep online status fresh
  useEffect(() => {
    if (!user?.username) return;
    const pollContacts = async () => {
      try {
        const res = await axiosInstance.get(`/users/${user.username}/following`);
        setContacts(res.data);
      } catch (err) {
        console.error('Failed to poll online status', err);
      }
    };
    const interval = setInterval(pollContacts, 20000);
    return () => clearInterval(interval);
  }, [user?.username]);

  // Filter contacts by search (Local filter of people you follow!)
  useEffect(() => {
    if (!contactSearch.trim()) {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(contacts.filter(c =>
        c.username.toLowerCase().includes(contactSearch.toLowerCase())
      ));
    }
  }, [contactSearch, contacts]);

  // Connect WebSocket once on mount
  useEffect(() => {
    if (!user?.username) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/ws`),
      reconnectDelay: 3000,
      onConnect: () => {
        setIsConnected(true);
        // Subscribe to our own topic
        client.subscribe(`/topic/messages/${user.username}`, (frame) => {
          const msg: Message = JSON.parse(frame.body);
          // Only add if it belongs to the current open conversation
          if (
            selectedUserRef.current &&
            (msg.senderUsername === selectedUserRef.current || msg.receiverUsername === selectedUserRef.current)
          ) {
            setMessages(prev => {
              // Deduplicate: don't add if already exists (since sender gets it back via REST too)
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            // Mark as read if we are actively viewing this chat!
            if (msg.senderUsername === selectedUserRef.current) {
              axiosInstance.post(`/messages/${msg.senderUsername}/read`).catch(() => {});
            }
          }
        });
      },
      onDisconnect: () => setIsConnected(false),
      onStompError: () => setIsConnected(false),
    });

    client.activate();
    stompClient.current = client;

    return () => { client.deactivate(); };
  }, [user?.username]);

  // Fetch mutual suggestions
  useEffect(() => {
    if (!user?.username) return;
    axiosInstance.get('/search/suggestions')
      .then(res => setSuggestions(res.data))
      .catch(err => console.error('Failed to fetch suggestions', err));
  }, [user?.username]);

  // Load message history when selecting a user
  const selectUser = useCallback(async (username: string) => {
    setSelectedUser(username);
    setErrorMsg('');
    setIsLoadingMessages(true);
    setMessages([]);
    try {
      const res = await axiosInstance.get(`/messages/${username}`);
      const history: Message[] = (res.data.content || []).reverse();
      setMessages(history);
      // Mark as read!
      await axiosInstance.post(`/messages/${username}/read`).catch(() => {});
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || isSending) return;

    const text = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Send via REST — backend saves + pushes via WebSocket to receiver
      const res = await axiosInstance.post(`/messages/${selectedUser}`, { content: text });
      // Add immediately to our own view (don't wait for WS echo)
      setMessages(prev => {
        if (prev.some(m => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send message';
      setErrorMsg(msg);
      setNewMessage(text); // restore
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post(`/messages/${selectedUser}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMessages(prev => {
        if (prev.some(m => m.id === response.data.id)) return prev;
        return [...prev, response.data];
      });
    } catch (err) {
      console.error('Failed to send image message', err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await axiosInstance.post(`/messages/${selectedUserRef.current}/voice`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          setMessages(prev => {
            if (prev.some(m => m.id === response.data.id)) return prev;
            return [...prev, response.data];
          });
        } catch (err) {
          console.error('Failed to send voice message', err);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Sidebar />
      <main className="pl-20 xl:pl-64 h-screen flex overflow-hidden bg-zinc-50/50 dark:bg-transparent">

        {/* LEFT: Contacts */}
        <div className="w-72 xl:w-80 border-r border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col flex-shrink-0">
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-black text-lg text-black dark:text-white">{user?.username}</h1>
              <div className={cn('w-2 h-2 rounded-full transition-colors', isConnected ? 'bg-green-400' : 'bg-zinc-300')} title={isConnected ? 'Connected' : 'Disconnected'} />
            </div>
            {/* Search contacts */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-400 uppercase mb-3">Suggested for you</p>
              <div className="space-y-3">
                {suggestions.map(s => (
                  <div key={s.username} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                        {s.username[0].toUpperCase()}
                      </div>
                      <div>
                        <Link href={`/${s.username}`} className="text-sm font-bold text-black dark:text-white hover:underline">{s.username}</Link>
                        <p className="text-[10px] text-zinc-400">Mutual match</p>
                      </div>
                    </div>
                    <button 
                      className="text-xs font-bold text-blue-500 hover:text-blue-600"
                      onClick={async () => {
                        try {
                          await axiosInstance.post(`/users/${s.username}/follow`);
                          setSuggestions(prev => prev.filter(u => u.username !== s.username));
                        } catch (err) {
                          console.error('Failed to follow', err);
                        }
                      }}
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredContacts.length === 0 ? (
              <p className="text-center text-zinc-400 text-sm mt-8 italic">No users found</p>
            ) : filteredContacts.map(c => (
              <div
                key={c.username}
                onClick={() => selectUser(c.username)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer',
                  selectedUser === c.username
                    ? 'bg-zinc-50 border-r-2 border-black'
                    : 'hover:bg-zinc-50/80'
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {c.username[0].toUpperCase()}
                  </div>
                  {c.showActivityStatus && c.isOnline && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-green-500 animate-pulse" title="Active Now" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-sm text-black dark:text-white truncate">{c.username}</p>
                  <p className="text-xs text-zinc-400 truncate">Tap to chat</p>
                </div>
                <button 
                  className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectUser(c.username);
                  }}
                >
                  Message
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat Window */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-zinc-100 bg-white flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {selectedUser[0].toUpperCase()}
                </div>
                <div>
                  <Link href={`/${selectedUser}`} className="font-bold text-black text-sm hover:underline dark:text-white">{selectedUser}</Link>
                  {contacts.find(c => c.username === selectedUser)?.showActivityStatus && contacts.find(c => c.username === selectedUser)?.isOnline ? (
                    <p className="text-[11px] text-green-500 font-bold">● Active now</p>
                  ) : (
                    <p className="text-[11px] text-zinc-400">Offline</p>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-zinc-300 border-t-black rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-300">
                    <MessageCircle className="w-12 h-12" />
                    <p className="text-sm font-medium">No messages yet. Say hi! 👋</p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.senderUsername === user?.username;
                    const prevMsg = messages[idx - 1];
                    const showAvatar = !prevMsg || prevMsg.senderUsername !== m.senderUsername;
                    return (
                      <motion.div
                        key={m.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15 }}
                        className={cn('flex items-end gap-2', isMe ? 'justify-end' : 'justify-start')}
                      >
                        {/* Avatar for receiver */}
                        {!isMe && (
                          <div className={cn('w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0', !showAvatar && 'invisible')}>
                            {m.senderUsername[0].toUpperCase()}
                          </div>
                        )}

                        <div className={cn('flex flex-col gap-0.5', isMe ? 'items-end' : 'items-start')}>
                          <div className={cn(
                            'max-w-xs xl:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
                            isMe
                              ? 'bg-black text-white rounded-br-sm'
                              : 'bg-white text-black border border-zinc-100 rounded-bl-sm shadow-sm'
                          )}>
                            {m.messageType === 'IMAGE' ? (
                              <img src={m.mediaUrl} alt="Sent image" className="rounded-lg max-w-full h-auto" />
                            ) : m.messageType === 'VOICE' ? (
                              <audio src={m.mediaUrl} controls className="max-w-full" />
                            ) : m.messageType === 'REEL' ? (
                              <div className="flex flex-col gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                                <p className="text-xs font-bold text-zinc-400 uppercase">Shared Reel</p>
                                <div className="relative w-40 h-60 bg-black rounded-lg overflow-hidden">
                                  <Link href="/reels" className="block w-full h-full">
                                    <video src={m.mediaUrl} className="w-full h-full object-cover" muted />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Play className="w-8 h-8 text-white drop-shadow" />
                                    </div>
                                  </Link>
                                </div>
                                <p className="text-xs text-zinc-600 truncate">{m.content}</p>
                              </div>
                            ) : (
                              m.content
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 px-1">{formatTime(m.createdAt)}</span>
                        </div>

                        {/* Checkmark for sent */}
                        {isMe && (
                          <CheckCheck className={cn("w-3.5 h-3.5 flex-shrink-0 mb-4", m.readAt ? "text-blue-500" : "text-zinc-300")} />
                        )}
                      </motion.div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>



              {/* Input Bar */}
              <form onSubmit={sendMessage} className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 flex-shrink-0">
                <label className="cursor-pointer text-zinc-400 hover:text-black transition-colors flex-shrink-0">
                  <Camera className="w-6 h-6" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={cn("cursor-pointer transition-colors flex-shrink-0", isRecording ? "text-red-500 animate-pulse" : "text-zinc-400 hover:text-black")}
                >
                  <Mic className="w-6 h-6" />
                </button>
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Message..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all pr-12"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(e as any)}
                  />
                </div>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.9 }}
                  disabled={!newMessage.trim() || isSending}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0',
                    newMessage.trim()
                      ? 'bg-black text-white hover:bg-zinc-800 shadow-md'
                      : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-zinc-300">
              <div className="w-24 h-24 rounded-full bg-zinc-50 border-2 border-zinc-100 flex items-center justify-center">
                <MessageCircle className="w-12 h-12" />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-zinc-800">Your Messages</p>
                <p className="text-zinc-400 text-sm mt-1">Select a contact to start chatting!</p>
              </div>
            </div>
          )}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full shadow-2xl font-medium flex items-center gap-2 z-50"
            >
              <span className="text-sm">{errorMsg}</span>
              <X className="w-4 h-4 cursor-pointer" onClick={() => setErrorMsg('')} />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
