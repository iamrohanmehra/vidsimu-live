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
import { ExportSessionModal } from '@/components/admin/ExportSessionModal';
import { useSessionExport } from '@/hooks/useSessionExport';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CountdownScreen } from '@/components/CountdownScreen';
import { Volume2, VolumeX, ExternalLink, Download, Sun, Moon, Radio, Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { viewerCount, viewers } = useCurrentViewers({
    streamId: id || '',
    enabled: !!id,
  });

  const { exportSession, isExporting } = useSessionExport({
    streamId: id || '',
    event,
    viewers,
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
        // Include public, broadcast, and private messages (admin replies)
        if (['public', 'broadcast', 'private'].includes(msg.messageType)) msgs.push(msg);
      });

      msgs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(msgs);
      setPinnedMessages(pinned);
    }, (error) => {
      console.error('Error fetching admin messages:', error);
    });
  }, [id]);

  const handleCopyId = useCallback(() => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [id]);

  // Action Handlers
  const handleSendMessage = useCallback(async (text: string, isAdmin: boolean, targetUser?: { id: string, email: string, name: string }) => {
    if (!id || !text.trim()) return;
    setIsSending(true);
    try {
      const messageData: Omit<Message, 'id'> = {
        streamId: id,
        userId: 'admin',
        name: 'Host',
        email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@codekaro.in',
        avatar: '',
        message: text.trim(),
        timestamp: serverTimestamp() as unknown as Date, // FireStore timestamp casting
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
  }, [id, pinnedMessages.length]);

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
  }, [pinnedMessages.length]);

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
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Main Layout (Sidebars + Main Content) */}
        <div className="h-screen flex overflow-hidden">
          
          {/* Main Content Area (Header + Video) */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Header */}
            <header className="border-b border-border px-6 py-3 shrink-0">
              <div className="flex items-center justify-between">
                {/* Left Side: Title & Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-lg font-semibold whitespace-nowrap">
                      {event.title} {event.topic && `| ${event.topic}`}
                      <span className="mx-2 text-muted-foreground font-normal">|</span>
                      <span className="font-mono text-sm bg-muted/50 px-2 py-0.5 rounded inline-flex items-center gap-2 group">
                        {id}
                        <button 
                          onClick={handleCopyId}
                          className="hover:text-primary transition-colors focus:outline-none"
                          title="Copy Session ID"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground" />
                          )}
                        </button>
                      </span>
                    </h1>
                    {streamStatus.status === 'live' && (
                      <span className="px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5" id="live-indicator">
                        <Radio className="w-3 h-3" />
                        Live
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Side: Metrics & Actions */}
                <div className="flex items-center gap-6">
                  {/* Metrics */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold tabular-nums" id="viewer-count">{viewerCount}</p>
                    </div>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <div className="text-left min-w-[120px]">
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

                  <Separator orientation="vertical" className="h-8" />

                  {/* Header Actions */}
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                          className="h-8 w-8"
                          id="toggle-preview-mute"
                        >
                          {isPreviewMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isPreviewMuted ? 'Unmute Preview' : 'Mute Preview'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(`/preview/${id}`, '_blank')}
                          className="h-8 w-8"
                          id="open-preview"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open Public Preview</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsExportModalOpen(true)}
                          disabled={streamStatus.status !== 'ended'}
                          className="h-8 w-8"
                          id="open-export-modal"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{streamStatus.status !== 'ended' ? 'Export disabled until session ends' : 'Export Session Data'}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleTheme}
                          className="h-8 w-8"
                          id="toggle-theme"
                        >
                          {isDark ? (
                            <Sun className="h-4 w-4" />
                          ) : (
                            <Moon className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isDark ? 'Switch to light mode' : 'Switch to dark mode'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Area (Video) */}
            <div className="flex-1 bg-black relative overflow-hidden flex flex-col justify-center">
              {streamStatus.status === 'live' ? (
                <div className="relative w-full h-full">
                  {/* Main Video: Screen Share or Face Cam fallback */}
                  <div className="absolute inset-0 z-0">
                    <VideoPlayer
                      url={event.screenUrl || event.url} 
                      muted={true} 
                      onMuteChange={() => {}}
                      isFaceVideo={false}
                      objectFit="contain"
                      streamStartTime={event.time ? new Date(event.time).getTime() : Date.now()}
                      className="w-full h-full"
                    />
                  </div>
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
          </div>

          {/* Sidebars (Full Height) */}
          {/* Chat Panel */}
          <aside className="w-[360px] border-l border-border flex flex-col h-full overflow-hidden shrink-0">
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

          {/* Audience/Polls Sidebar */}
          <aside className="w-[360px] border-l border-border flex flex-col h-full overflow-hidden shrink-0">
            {/* Instructor Video at the top */}
            <div className="w-full aspect-video border-b border-border bg-black shrink-0">
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

            <Tabs defaultValue="audience" className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 pt-3 shrink-0">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="audience">
                    Audience ({viewerCount})
                  </TabsTrigger>
                  <TabsTrigger value="polls">
                    Polls
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="audience" className="flex-1 m-0 overflow-hidden min-h-0">
                <div className="h-full">
                  <AdminViewersList viewers={viewers} viewerCount={viewerCount} />
                </div>
              </TabsContent>
              
              <TabsContent value="polls" className="flex-1 m-0 overflow-hidden min-h-0">
                <div className="h-full">
                  <AdminPollManager streamId={id || ''} />
                </div>
              </TabsContent>
            </Tabs>
          </aside>
        </div>

        {/* Export Session Modal */}
        <ExportSessionModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={exportSession}
          isExporting={isExporting}
          defaultTitle={event?.title || ''}
        />
      </div>
    </TooltipProvider>
  );
}
