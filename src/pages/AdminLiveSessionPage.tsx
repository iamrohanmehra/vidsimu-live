import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import { useVideoDuration } from '@/hooks/useVideoDuration';
import {
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { messagesCollection } from '@/lib/collections';
import { AdminChatPanel } from '@/components/admin/AdminChatPanel';
import { AdminViewersList } from '@/components/admin/AdminViewersList';
import { AdminPollManager } from '@/components/admin/AdminPollManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CountdownScreen } from '@/components/CountdownScreen';
import type { Event, Message } from '@/types';

export function AdminLiveSessionPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const { viewerCount, viewers } = useCurrentViewers({
    streamId: id || '',
    enabled: !!id,
  });

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch duration from face cam URL
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
    const q = query(messagesCollection, where('streamId', '==', id));
    
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

      msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(msgs);
      setPinnedMessages(pinned);
    }, (error) => {
      console.error('Error fetching admin messages:', error);
    });
  }, [id]);

  // Action Handlers
  const handleSendMessage = useCallback(async (text: string, isAdmin: boolean, targetUser?: { id: string, email: string, name: string }) => {
    if (!id || !text.trim()) return;
    setIsSending(true);
    try {
      const messageData: any = {
        streamId: id,
        userId: 'admin',
        name: 'Host',
        email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@codekaro.in',
        avatar: '',
        message: text.trim(),
        timestamp: serverTimestamp(),
        messageType: 'public',
        isAdminMessage: isAdmin,
      };

      if (targetUser) {
        messageData.messageType = 'private';
        messageData.targetUserId = targetUser.id;
        messageData.targetUserEmail = targetUser.email;
        messageData.targetUserName = targetUser.name;
      }

      await addDoc(messagesCollection, messageData);
    } finally { setIsSending(false); }
  }, [id]);

  const handleSendBroadcast = useCallback(async (text: string) => {
    if (!id || !text.trim()) return;

    // Strict Limit: Only one broadcast allowed
    if (pinnedMessages.length > 0) {
      alert('Only one broadcast message can be pinned at a time.');
      return;
    }

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
        isPinned: true,
        pinnedAt: serverTimestamp(),
        pinnedBy: 'admin',
      });
    } finally { setIsSending(false); }
  }, [id]);

  const handlePinMessage = useCallback(async (messageId: string) => {
    // Strict Limit: Only one pinned message allowed
    if (pinnedMessages.length > 0) {
      alert('Only one message can be pinned at a time.');
      return;
    }

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

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
    } catch (e) { console.error('Error deleting message:', e); }
  }, []);

  const handleClearChat = useCallback(async () => {
    if (!id) return;
    try {
      const q = query(messagesCollection, where('streamId', '==', id));
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (e) {
      console.error('Error clearing chat:', e);
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading Command Center...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">Session Not Found</p>
      </div>
    );
  }

  // Time formatting helper
  const formatTime = (ms: number) => {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor((ms / (1000 * 60 * 60)));
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate stream timing
  const getStreamStatus = () => {
    if (!event?.time) {
      return { status: 'unscheduled' as const };
    }

    const start = new Date(event.time).getTime();
    const now = currentTime.getTime();
    
    let durationMs = 60 * 60 * 1000;
    if (streamDuration && streamDuration > 0) {
      durationMs = streamDuration * 1000;
    } else if (event.duration) {
      durationMs = event.duration * 60 * 1000;
    }

    if (now < start) {
      return { status: 'scheduled' as const, startTime: new Date(event.time) };
    }

    const elapsed = now - start;

    if (elapsed >= durationMs) {
      return { status: 'ended' as const };
    }

    return { status: 'live' as const, elapsed, duration: durationMs };
  };

  const streamStatus = getStreamStatus();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main Layout */}
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-border px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{event.title}</h1>
                {streamStatus.status === 'live' && (
                  <span className="px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                    Live
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Command Center • {id}
                {event.topic && ` • ${event.topic}`}
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Metrics */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-bold tabular-nums">{viewerCount}</p>
                  <p className="text-xs text-muted-foreground">Watching</p>
                </div>
                
                <Separator orientation="vertical" className="h-10" />
                
                <div className="text-right min-w-[140px]">
                  {streamStatus.status === 'unscheduled' && (
                    <p className="text-sm text-muted-foreground">Not scheduled</p>
                  )}
                  {streamStatus.status === 'scheduled' && (
                    <div>
                      <p className="text-lg font-mono text-amber-500">
                        {streamStatus.startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-muted-foreground">Scheduled</p>
                    </div>
                  )}
                  {streamStatus.status === 'ended' && (
                    <p className="text-sm font-medium text-destructive">Ended</p>
                  )}
                  {streamStatus.status === 'live' && (
                    <div>
                      <p className="text-lg font-mono tabular-nums">
                        {formatTime(streamStatus.elapsed)} <span className="text-muted-foreground">/</span> {formatTime(streamStatus.duration)}
                      </p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator orientation="vertical" className="h-10" />

              {/* Preview Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                className="gap-2"
              >
                {isPreviewMuted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
                {isPreviewMuted ? 'Unmute Preview' : 'Mute Preview'}
              </Button>

              {/* Preview Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/preview/${id}`, '_blank')}
                className="gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Preview
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content Area - Video / Countdown */}
          <div className="flex-1 bg-black relative overflow-hidden flex flex-col justify-center">
            {streamStatus.status === 'live' ? (
              <div className="relative w-full h-full">
                {/* Main: Screen Share */}
                <div className="absolute inset-0 z-0">
                  <VideoPlayer
                    url={event.screenUrl || event.url} // Fallback to main URL if no screen share
                    muted={true} // Screen share audio usually muted or mixed in facecam
                    onMuteChange={() => {}}
                    isFaceVideo={false}
                    objectFit="contain"
                    streamStartTime={event.time ? new Date(event.time).getTime() : Date.now()}
                    className="w-full h-full"
                  />
                </div>

                {/* Overlay: Face Cam (if screen share exists, otherwise main is facecam) */}
                {event.screenUrl && (
                  <div className="absolute bottom-4 right-4 z-10 w-48 md:w-64 aspect-video rounded-lg overflow-hidden shadow-2xl border border-white/10 bg-black">
                    <VideoPlayer
                      url={event.url}
                      muted={isPreviewMuted}
                      onMuteChange={setIsPreviewMuted}
                      isFaceVideo={true}
                      objectFit="cover"
                      streamStartTime={event.time ? new Date(event.time).getTime() : Date.now()}
                      className="w-full h-full"
                    />
                  </div>
                )}
                
                {/* Audio control for main video if no screenshare (acts as facecam main) */}
                {!event.screenUrl && (
                   <div className="absolute top-4 right-4 z-20">
                     {/* Mute control is in header, but we need to ensure audio plays from this player */}
                     {/* Currently VideoPlayer prop 'muted' is hardcoded true above for screen share slot. 
                         If we use main slot for facecam, we should pass isPreviewMuted there. 
                         Let's refine logic below.
                     */}
                   </div>
                )}
              </div>
            ) : streamStatus.status === 'ended' ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-foreground">Session Ended</h2>
                  <p className="mt-2">Thank you for hosting!</p>
                </div>
              </div>
            ) : (
              // Scheduled / Unscheduled -> Countdown
              <div className="h-full w-full flex items-center justify-center">
                {event.time ? (
                  <CountdownScreen 
                    event={event} 
                    targetTime={new Date(event.time).getTime()} 
                    onCountdownComplete={() => {}} 
                    isEmbedded={true}
                  />
                ) : (
                  <div className="text-muted-foreground">Not Scheduled</div>
                )}
              </div>
            )}
          </div>

          {/* Chat Panel - Same width as sidebar */}
          <aside className="w-[360px] border-l border-border flex flex-col">
            <AdminChatPanel
              messages={messages}
              pinnedMessages={pinnedMessages}
              onSendMessage={handleSendMessage}
              onSendBroadcast={handleSendBroadcast}
              onPinMessage={handlePinMessage}
              onUnpinMessage={handleUnpinMessage}
              onDeleteMessage={handleDeleteMessage}
              onClearChat={handleClearChat}
              isSending={isSending}
            />
          </aside>

          {/* Sidebar with Tabs */}
          <aside className="w-[360px] border-l border-border flex flex-col">
            <Tabs defaultValue="audience" className="flex-1 flex flex-col">
              <div className="px-4 pt-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="audience">
                    Audience ({viewerCount})
                  </TabsTrigger>
                  <TabsTrigger value="polls">
                    Polls
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="audience" className="flex-1 m-0 overflow-hidden">
                <div className="h-full">
                  <AdminViewersList viewers={viewers} viewerCount={viewerCount} />
                </div>
              </TabsContent>
              
              <TabsContent value="polls" className="flex-1 m-0 overflow-hidden">
                <div className="h-full">
                  <AdminPollManager streamId={id || ''} />
                </div>
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </div>
    </div>
  );
}
