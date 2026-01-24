import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import { useVideoDuration } from '@/hooks/useVideoDuration';
import {
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { messagesCollection } from '@/lib/collections';
import { AdminChatPanel } from '@/components/admin/AdminChatPanel';
import { AdminViewersList } from '@/components/admin/AdminViewersList';
import { AdminPollManager } from '@/components/admin/AdminPollManager';
import type { Event, Message } from '@/types';

// Metric Card Component


export function AdminLiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { viewerCount, viewers } = useCurrentViewers({
    streamId: id || '',
    enabled: !!id,
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch duration from face cam URL (assuming it's reliable)
  const streamDuration = useVideoDuration(event?.url);

  // Load event data
  useEffect(() => {
    if (!id) return;
    const loadEvent = async () => {
      try {
        const eventData = await fetchBatch(id);
        setEvent(eventData);
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEvent();
  }, [id]);

  // Listen for messages
  useEffect(() => {
    if (!id) return;
    const q = query(messagesCollection, where('streamId', '==', id), orderBy('timestamp', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      const pinned: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const msg = { 
          id: doc.id, 
          ...data, 
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date() 
        } as Message;
        
        if (msg.isPinned) pinned.push(msg);
        if (['public', 'broadcast'].includes(msg.messageType)) msgs.push(msg);
      });
      setMessages(msgs);
      setPinnedMessages(pinned);
    });
  }, [id]);

  // Action Handlers
  const handleSendMessage = useCallback(async (text: string, isAdmin: boolean) => {
    if (!id || !text.trim()) return;
    setIsSending(true);
    try {
      await addDoc(messagesCollection, {
        streamId: id,
        userId: 'admin',
        name: 'Host',
        email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@codekaro.in',
        avatar: '',
        message: text.trim(),
        timestamp: serverTimestamp(),
        messageType: 'public',
        isAdminMessage: isAdmin,
      });
    } finally { setIsSending(false); }
  }, [id]);

  const handleSendBroadcast = useCallback(async (text: string) => {
    if (!id || !text.trim()) return;
    setIsSending(true);
    try {
      await addDoc(messagesCollection, {
        streamId: id,
        userId: 'admin',
        name: 'Host',
        email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@codekaro.in',
        avatar: '',
        message: text.trim(),
        timestamp: serverTimestamp(),
        messageType: 'broadcast',
        isAdminMessage: true,
      });
    } finally { setIsSending(false); }
  }, [id]);

  const handlePinMessage = useCallback(async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { isPinned: true, pinnedAt: serverTimestamp(), pinnedBy: 'admin' });
    } catch (e) { console.error(e); }
  }, []);

  const handleUnpinMessage = useCallback(async (messageId: string) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { isPinned: false, pinnedAt: null, pinnedBy: null });
    } catch (e) { console.error(e); }
  }, []);

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-neutral-500">Loading Command Center...</div>;
  if (!event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Session Not Found</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6 font-sans">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-48px)] flex flex-col gap-6">
        
        {/* Top Header & Stats */}
        <div className="flex flex-col gap-6 shrink-0">
          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
                <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Live
                </span>

              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>Command Center • {id}</span>
                {event.topic && (
                  <>
                    <span>•</span>
                    <span className="text-violet-400 font-medium">{event.topic}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right flex items-center gap-8">
               <div className="flex flex-col items-end">
                  <p className="text-3xl font-bold text-white tracking-tight leading-none">{viewerCount}</p>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wider mt-1">Watching</p>
               </div>
               <div className="flex flex-col items-end min-w-[200px]">
                  {(() => {
                    // 1. Check if schedule exists
                    if (!event?.time) {
                      return (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800/50 border border-neutral-700">
                          <span className="w-2 h-2 rounded-full bg-neutral-500"></span>
                          <span className="text-xs font-medium text-neutral-400">Stream not scheduled</span>
                        </div>
                      );
                    }

                    const start = new Date(event.time).getTime();
                    const now = currentTime.getTime();
                    
                    // Priority: 1. Fetched from video (streamDuration) 2. Manual event.duration 3. Default 60 mins
                    // Duration calculation must be consistent
                    let durationMs = 60 * 60 * 1000;
                    if (streamDuration && streamDuration > 0) {
                      durationMs = streamDuration * 1000;
                    } else if (event.duration) {
                      durationMs = event.duration * 60 * 1000;
                    }

                    // 2. Check if stream hasn't started
                     if (now < start) {
                      return (
                         <div className="flex flex-col items-end">
                            <p className="text-xl font-mono text-amber-400">
                              {new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-amber-500/70 font-medium uppercase tracking-wider mt-1">Scheduled Start</p>
                         </div>
                      );
                    }

                    const elapsed = now - start;

                    // 3. Check if stream ended
                    if (elapsed >= durationMs) {
                       return (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/30 border border-red-500/30">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Stream Ended</span>
                        </div>
                      );
                    }

                    // 4. Active Stream Timer
                    const formatTime = (ms: number) => {
                      const s = Math.floor((ms / 1000) % 60);
                      const m = Math.floor((ms / (1000 * 60)) % 60);
                      const h = Math.floor((ms / (1000 * 60 * 60)));
                      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    };

                    return (
                      <>
                        <p className="text-2xl font-mono text-neutral-300">
                          {formatTime(elapsed)} <span className="text-neutral-600 mx-2">/</span> {formatTime(durationMs)}
                        </p>
                        <p className="text-xs text-neutral-500 uppercase tracking-wider text-right">Playback / Duration</p>
                      </>
                    );
                  })()}
               </div>
            </div>
          </div>
        </div>

        {/* Dashboard Panels */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Main Chat Console (65%) */}
          <div className="flex-2 min-w-0">
             <AdminChatPanel
              messages={messages}
              pinnedMessages={pinnedMessages}
              onSendMessage={handleSendMessage}
              onSendBroadcast={handleSendBroadcast}
              onPinMessage={handlePinMessage}
              onUnpinMessage={handleUnpinMessage}
              isSending={isSending}
            />
          </div>

          {/* Sidebar (35%) - Viewers + Polls */}
          <div className="flex-1 min-w-[300px] max-w-[400px] flex flex-col gap-4 overflow-hidden">
             <div className="flex-1 min-h-0 overflow-hidden">
               <AdminViewersList viewers={viewers} viewerCount={viewerCount} />
             </div>
             <div className="h-[45%] min-h-[250px]">
               <AdminPollManager streamId={id || ''} />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
