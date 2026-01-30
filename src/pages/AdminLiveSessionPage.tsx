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
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminChatPanel } from '@/components/admin/AdminChatPanel';
import { ExportSessionModal } from '@/components/admin/ExportSessionModal';
import { TerminateSessionModal } from '@/components/admin/TerminateSessionModal';
import { ReactivateSessionModal } from '@/components/admin/ReactivateSessionModal';
import { useSessionExport } from '@/hooks/useSessionExport';
import { useSessionTermination } from '@/hooks/useSessionTermination';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CountdownScreen } from '@/components/CountdownScreen';
import { Volume2, VolumeX, ExternalLink, Download, Radio, Copy, Check, UsersRound, Power, LockOpen, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
  const [broadcastText, setBroadcastText] = useState('');
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
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

  const { terminateSession, isTerminating, isTerminated, reactivateSession, isReactivating } = useSessionTermination({
    sessionId: id || '',
    enabled: !!id,
  });


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

  const handleSendBroadcast = useCallback(async (
    text: string,
    options?: { link?: string; showQrCode?: boolean }
  ) => {
    if (!id) return;
    // Allow broadcast with just link or just text
    if (!text.trim() && !options?.link?.trim()) return;

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
        // Broadcast-specific fields
        broadcastLink: options?.link?.trim() || undefined,
        showQrCode: options?.showQrCode || false,
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
        <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
          
          {/* Main Content Area (Header + Video) */}
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Header */}
            <header className="min-h-14 h-auto lg:h-14 py-2 lg:py-0 border-b border-neutral-800 flex flex-wrap lg:flex-nowrap items-center px-4 lg:px-6 bg-neutral-900/50 backdrop-blur-md shrink-0 justify-between gap-3 lg:gap-4 order-first">
              {/* Left Side: Title & Info */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="flex items-center gap-3 min-w-0">
                  <h1 className="text-sm font-medium text-neutral-200 truncate flex items-center gap-2">
                    <span className="truncate">{event.title}</span>
                    {event.topic && (
                      <>
                        <span className="text-neutral-600">|</span>
                        <span className="text-neutral-400 truncate">{event.topic}</span>
                      </>
                    )}
                  </h1>
                  


                  {streamStatus.status === 'live' && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5 shrink-0" id="live-indicator">
                      <Radio className="w-3 h-3" />
                      Live
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side: Metrics & Actions */}
              <div className="flex items-center gap-6 shrink-0">
                {/* Metrics */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <UsersRound className="w-4 h-4 text-neutral-500" />
                    <p className="text-sm font-bold tabular-nums text-neutral-200" id="viewer-count">{viewerCount}</p>
                  </div>
                  
                  <div className="text-right min-w-[80px]">
                    {streamStatus.status === 'unscheduled' && (
                      <p className="text-xs text-neutral-500">Not scheduled</p>
                    )}
                    {streamStatus.status === 'scheduled' && (
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-amber-500 font-mono">
                          {streamStatus.startTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Starts</span>
                      </div>
                    )}
                    {streamStatus.status === 'ended' && (
                      <p className="text-xs font-bold text-destructive uppercase tracking-wider">Ended</p>
                    )}
                    {streamStatus.status === 'live' && (
                      <div className="flex items-center gap-2 justify-end">
                         <span className="text-xs font-mono tabular-nums text-neutral-300">
                          {formatTime(streamStatus.elapsed)}
                        </span>
                        <span className="text-neutral-600">/</span>
                        <span className="text-xs font-mono tabular-nums text-neutral-500">
                          {formatTime(streamStatus.duration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Header Actions - Shadcn Dropdown */}
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 flex shrink-0"
                          id="admin-actions-dropdown"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>More Actions</p>
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent align="end" className="w-56 bg-neutral-900 border-neutral-800">
                    <DropdownMenuItem 
                      onClick={() => setIsPreviewMuted(!isPreviewMuted)}
                      className="text-neutral-300 focus:text-white focus:bg-neutral-800 cursor-pointer flex items-center gap-2"
                    >
                      {isPreviewMuted ? (
                        <VolumeX className="h-4 w-4 text-neutral-500" />
                      ) : (
                        <Volume2 className="h-4 w-4 text-neutral-500" />
                      )}
                      <span>{isPreviewMuted ? 'Unmute' : 'Mute'} Preview</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => window.open(`/preview/${id}`, '_blank')}
                      className="text-neutral-300 focus:text-white focus:bg-neutral-800 cursor-pointer flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4 text-neutral-500" />
                      <span>Open Preview</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={() => setIsExportModalOpen(true)}
                      disabled={streamStatus.status !== 'ended'}
                      className="text-neutral-300 focus:text-white focus:bg-neutral-800 cursor-pointer flex items-center gap-2"
                    >
                      <Download className="h-4 w-4 text-neutral-500" />
                      <span>Export Session</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                      onClick={handleCopyId}
                      className="text-neutral-300 focus:text-white focus:bg-neutral-800 cursor-pointer flex items-center gap-2"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-neutral-500" />
                      )}
                      <span>{isCopied ? 'Copied ID' : 'Copy Session ID'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-neutral-800" />

                    {/* Terminate Session Button */}
                    <DropdownMenuItem 
                      onClick={() => setIsTerminateModalOpen(true)}
                      disabled={streamStatus.status !== 'live' || isTerminated}
                      className="text-rose-400 focus:text-rose-100 focus:bg-rose-500/20 cursor-pointer flex items-center gap-2"
                    >
                      <Power className="h-4 w-4" />
                      <span>Terminate Session</span>
                    </DropdownMenuItem>

                    {/* Reactivate Session (Unlock) - Only visible if terminated */}
                    {isTerminated && (
                      <DropdownMenuItem 
                        onClick={() => setIsReactivateModalOpen(true)}
                        disabled={isReactivating}
                        className="text-emerald-400 focus:text-emerald-100 focus:bg-emerald-500/20 cursor-pointer flex items-center gap-2"
                      >
                        <LockOpen className={`h-4 w-4 ${isReactivating ? 'animate-spin' : ''}`} />
                        <span>Reactivate Session</span>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      instructorName={!event.screenUrl ? (event.instructor || 'Ashish Shukla') : undefined}
                    />
                  </div>

                  {/* Mobile Face Cam PIP (only if screen share is active) */}
                  {event.screenUrl && (
                    <div className="absolute top-4 right-4 w-24 sm:w-32 aspect-video bg-black border border-white/10 rounded-lg overflow-hidden shadow-lg z-10 lg:hidden">
                      <VideoPlayer
                        url={event.url}
                        muted={true}
                        onMuteChange={() => {}}
                        isFaceVideo={true}
                        objectFit="cover"
                        streamStartTime={event.time ? new Date(event.time).getTime() : Date.now()}
                        className="w-full h-full"
                      />
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
          </div>

          {/* Desktop Sidebars */}
          <div className="hidden lg:flex h-full shrink-0">
            <aside id="sidebar-messages" className="w-[350px] h-full border-l border-neutral-800 bg-neutral-900 flex flex-col relative transition-all duration-300">
              <AdminChatPanel
                messages={messages}
                pinnedMessages={pinnedMessages}
                onSendMessage={handleSendMessage}
                onPinMessage={handlePinMessage}
                onUnpinMessage={handleUnpinMessage}
                onDeleteMessage={handleDeleteMessage}
                onClearChat={handleClearChat}
                isSending={isSending}
              />
            </aside>
            <AdminSidebar
              id={id!}
              event={event}
              viewers={viewers}
              viewerCount={viewerCount}
              isPreviewMuted={isPreviewMuted}
              setIsPreviewMuted={setIsPreviewMuted}
              broadcastText={broadcastText}
              setBroadcastText={setBroadcastText}
              handleSendBroadcast={handleSendBroadcast}
              isSending={isSending}
            />
          </div>

          {/* Mobile Unified Admin Panel */}
          <div className="flex lg:hidden flex-1 min-h-0">
            <AdminSidebar
              id={id!}
              event={event}
              viewers={viewers}
              viewerCount={viewerCount}
              isPreviewMuted={isPreviewMuted}
              setIsPreviewMuted={setIsPreviewMuted}
              broadcastText={broadcastText}
              setBroadcastText={setBroadcastText}
              handleSendBroadcast={handleSendBroadcast}
              isSending={isSending}
              hideVideo={true}
              chatPanel={
                <AdminChatPanel
                  messages={messages}
                  pinnedMessages={pinnedMessages}
                  onSendMessage={handleSendMessage}
                  onPinMessage={handlePinMessage}
                  onUnpinMessage={handleUnpinMessage}
                  onDeleteMessage={handleDeleteMessage}
                  onClearChat={handleClearChat}
                  isSending={isSending}
                />
              }
            />
          </div>
        </div>

        {/* Reactivate Session Modal */}
        <ReactivateSessionModal
          isOpen={isReactivateModalOpen}
          onClose={() => setIsReactivateModalOpen(false)}
          onConfirm={reactivateSession}
          isReactivating={isReactivating}
        />

        {/* Export Session Modal */}
        <ExportSessionModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={exportSession}
          isExporting={isExporting}
          defaultTitle={event?.title || ''}
        />

        {/* Terminate Session Modal */}
        <TerminateSessionModal
          isOpen={isTerminateModalOpen}
          onClose={() => setIsTerminateModalOpen(false)}
          onConfirm={async (message) => {
            await terminateSession(message);
          }}
          isTerminating={isTerminating}
        />
      </div>
    </TooltipProvider>
  );
}
