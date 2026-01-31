import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { getStoredUser } from '@/lib/api';
import { usePresence } from '@/hooks/usePresence';
import { useSessionGating } from '@/hooks/useSessionGating';
import { useChat } from '@/hooks/useChat';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import { useOptimisticVideoSync } from '@/hooks/useOptimisticVideoSync';
import { useBannedUsers } from '@/hooks/useBannedUsers';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { JoinSessionModal } from '@/components/JoinSessionModal';
import { StreamContainer } from '@/components/StreamContainer';
import { CountdownScreen } from '@/components/CountdownScreen';
import { ConnectingScreen } from '@/components/ConnectingScreen';
import { SessionEndedScreen } from '@/components/SessionEndedScreen';
import { SessionTerminatedScreen } from '@/components/SessionTerminatedScreen';
import { SessionLimitScreen } from '@/components/SessionLimitScreen';
import { SessionNotScheduledScreen } from '@/components/SessionNotScheduledScreen';
import { SessionBannedScreen } from '@/components/SessionBannedScreen';
import { useSessionTermination } from '@/hooks/useSessionTermination';
import type { Event, User, StreamState, Message } from '@/types';

export function StreamPage() {
  const { uuid } = useParams<{ uuid: string }>();
  
  // Core state
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [streamState, setStreamState] = useState<StreamState>(!uuid ? 'error' : 'loading');
  const [error, setError] = useState<string | null>(!uuid ? 'Invalid stream ID' : null);
  
  // UI state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [showSyncOverlay, setShowSyncOverlay] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Calculate stream start time
  const streamStartTime = useMemo(() => {
    if (!event?.time) return 0;
    return new Date(event.time).getTime();
  }, [event]);

  // Calculate effective stream start (after connecting delay)
  const connectingDelay = event?.connectingDelay ?? 30; // Default 30 seconds
  const effectiveStreamStart = useMemo(() => {
    return streamStartTime + (connectingDelay * 1000);
  }, [streamStartTime, connectingDelay]);

  // Hooks - only enable when user has joined
  const { clientId, viewerCount } = usePresence({
    streamId: uuid || '',
    user,
    enabled: hasJoined && !!user && !!uuid,
  });

  const { isActiveSession } = useSessionGating({
    eventId: uuid || '',
    user,
    enabled: hasJoined && !!user && !!uuid,
  });

  const { userMessages, privateMessages, sendMessage, isSending } = useChat({
    streamId: uuid || '',
    user,
    clientId,
    enabled: hasJoined && !!user && !!uuid,
  });

  // Also get viewer count for display even before joining
  const { viewerCount: displayViewerCount } = useCurrentViewers({
    streamId: uuid || '',
    enabled: !!uuid,
  });

  // Check if user is banned from this session
  const { isUserBanned, isLoading: isBanCheckLoading } = useBannedUsers({
    sessionId: uuid || '',
    enabled: !!uuid && !!user,
  });

  // Determine if current user is banned
  const isCurrentUserBanned = useMemo(() => {
    if (!user?.email) return false;
    return isUserBanned(user.email);
  }, [user, isUserBanned]);

  // Check for session termination
  const { isTerminated, terminationData } = useSessionTermination({
    sessionId: uuid || '',
    enabled: !!uuid,
  });

  // Combine messages for display
  const allMessages = useMemo(() => {
    const combined = [...userMessages, ...privateMessages];
    // Deduplicate by ID
    const uniqueMap = new Map();
    combined.forEach(msg => {
      if (msg.id) uniqueMap.set(msg.id, msg);
    });
    return Array.from(uniqueMap.values()).sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [userMessages, privateMessages]);

  // Use optimistic video sync when transitioning to live (for late joiners)
  const syncState = useOptimisticVideoSync({
    streamStartTime: effectiveStreamStart,
    videoUrl: event?.url, // Use facecam URL for duration check
    enabled: streamState === 'live' && showSyncOverlay,
  });

  // Load event data
  useEffect(() => {
    if (!uuid) {
      return;
    }

    const loadEvent = async () => {
      try {
        const eventData = await fetchBatch(uuid);
        
        if (!eventData) {
          setError('Event not found');
          setStreamState('error');
          return;
        }

        setEvent(eventData);

        // Check if stream URLs exist
        if (!eventData.url && !eventData.screenUrl) {
          setStreamState('unavailable');
          return;
        }

        // Determine initial stream state based on time
        const now = Date.now();
        const startTime = new Date(eventData.time).getTime();
        const delay = eventData.connectingDelay ?? 30;
        const effectiveStart = startTime + (delay * 1000);

        const durationMinutes = eventData.duration ?? 60;
        const endTime = effectiveStart + (durationMinutes * 60 * 1000);

        if (now < startTime) {
          setStreamState('countdown');
        } else if (now < effectiveStart) {
          setStreamState('connecting');
        } else if (now > endTime) {
          setStreamState('ended');
        } else {
          // Late joiner - show sync overlay during live state
          setStreamState('live');
          setShowSyncOverlay(true);
        }

        // Check for stored user
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setShowJoinModal(true);
        } else {
          setShowEmailModal(true);
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event');
        setStreamState('error');
      }
    };

    loadEvent();
  }, [uuid]);

  // Handle email verification
  const handleEmailVerified = useCallback((verifiedUser: User) => {
    setUser(verifiedUser);
    setShowEmailModal(false);
    // Skip Join Modal and Join Immediately on first verify
    setHasJoined(true);
    setMuted(false); // Enable audio since user just interacted with the verification modal
  }, []);

  // Handle join session
  const handleJoin = useCallback(() => {
    setShowJoinModal(false);
    setMuted(false); // Unmute after user gesture
    setHasJoined(true);
  }, []);

  // Handle countdown complete -> transition to connecting
  const handleCountdownComplete = useCallback(() => {
    setStreamState('connecting');
  }, []);

  // Handle connecting complete -> transition to live
  const handleConnectingComplete = useCallback(() => {
    setStreamState('live');
    setShowSyncOverlay(false); // Video is already ready from background sync
  }, []);

  // Handle sync overlay complete -> hide overlay
  const handleSyncComplete = useCallback(() => {
    setShowSyncOverlay(false);
  }, []);

  // Handle stream end (called by facecam when video finishes)
  const handleStreamEnd = useCallback(() => {
    setStreamState('ended');
  }, []);
  // Handle refresh for session limit
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Toggle chat
  const handleToggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  // Loading state
  if (streamState === 'loading' || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (streamState === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-neutral-400 mb-6">{error || 'Failed to load stream'}</p>
          <a href="/" className="text-violet-400 hover:text-violet-300">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Session limit reached
  if (hasJoined && !isActiveSession) {
    return <SessionLimitScreen onRefresh={handleRefresh} />;
  }

  // User is banned from this session
  if (user && isCurrentUserBanned && !isBanCheckLoading) {
    return <SessionBannedScreen />;
  }

  // Countdown state
  if (streamState === 'countdown') {
    return (
      <>
        <CountdownScreen
          event={event}
          targetTime={streamStartTime}
          onCountdownComplete={handleCountdownComplete}
        />
        <EmailVerificationModal
          isOpen={showEmailModal}
          onVerified={handleEmailVerified}
        />
        {user && (
          <JoinSessionModal
            isOpen={showJoinModal}
            event={event}
            onJoin={handleJoin}
          />
        )}
      </>
    );
  }

  // Unavailable state
  if (streamState === 'unavailable' && event) {
    return <SessionNotScheduledScreen />;
  }

  // Session terminated by admin
  if (isTerminated && terminationData) {
    return <SessionTerminatedScreen terminationData={terminationData} />;
  }

  // Ended state
  if (streamState === 'ended') {
    return <SessionEndedScreen event={event!} />;
  }

  // Connecting or Live state (Render player + overlay if connecting)
  if (streamState === 'connecting' || streamState === 'live') {
    return (
      <>
        {/* Main Stream Container (Always rendered in background for buffering) */}
        <StreamContainer
          event={event}
          screenUrl={event.screenUrl}
          faceUrl={event.url}
          muted={muted}
          onMuteChange={setMuted}
          messages={allMessages}
          onSendMessage={sendMessage}
          isSending={isSending}
          viewerCount={hasJoined ? viewerCount : displayViewerCount}
          streamStartTime={effectiveStreamStart}
          isChatOpen={isChatOpen}
          onToggleChat={handleToggleChat}
          onStreamEnd={handleStreamEnd}
          initialSeekTime={syncState.estimatedTime}
          visitorId={clientId}
          userName={user?.name}
          userEmail={user?.email}
          onVideoReady={() => setIsVideoReady(true)}
        />

        {/* Connecting Screen Overlay (Gatekeeper) */}
        {streamState === 'connecting' && (
          <ConnectingScreen
            event={event}
            effectiveStreamStart={effectiveStreamStart}
            onConnectingComplete={handleConnectingComplete}
            isOverlay={true}
            readyToTransition={isVideoReady}
          />
        )}

        {/* Black Curtain - Hides everything while user is verifying/joining */}
        {!hasJoined && (
          <div className="fixed inset-0 bg-black z-40 transition-opacity duration-500" />
        )}

        {/* Sync overlay - shown while videos are loading and syncing (Live late joiners) */}
        {showSyncOverlay && hasJoined && streamState === 'live' && (
          <ConnectingScreen
            event={event}
            effectiveStreamStart={effectiveStreamStart}
            syncConfidence={syncState.syncConfidence}
            onConnectingComplete={handleSyncComplete}
            isOverlay={true}
          />
        )}

        <EmailVerificationModal
          isOpen={showEmailModal}
          onVerified={handleEmailVerified}
        />

        {user && (
          <JoinSessionModal
            isOpen={showJoinModal}
            event={event}
            onJoin={handleJoin}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
       <span className="text-white">Unreachable State</span>
    </div>
  );
}
