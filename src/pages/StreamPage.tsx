import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { getStoredUser } from '@/lib/api';
import { usePresence } from '@/hooks/usePresence';
import { useSessionGating } from '@/hooks/useSessionGating';
import { useChat } from '@/hooks/useChat';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import { EmailVerificationModal } from '@/components/EmailVerificationModal';
import { JoinSessionModal } from '@/components/JoinSessionModal';
import { StreamContainer } from '@/components/StreamContainer';
import { CountdownScreen } from '@/components/CountdownScreen';
import { ConnectingScreen } from '@/components/ConnectingScreen';
import { SessionEndedScreen } from '@/components/SessionEndedScreen';
import { SessionLimitScreen } from '@/components/SessionLimitScreen';
import type { Event, User, StreamState } from '@/types';

export function StreamPage() {
  const { uuid } = useParams<{ uuid: string }>();
  
  // Core state
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [streamState, setStreamState] = useState<StreamState>('loading');
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  // Calculate stream start time
  const streamStartTime = useMemo(() => {
    if (!event?.time) return 0;
    return new Date(event.time).getTime();
  }, [event?.time]);

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

  // Combine messages for display
  const allMessages = useMemo(() => {
    const combined = [...userMessages, ...privateMessages];
    return combined.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [userMessages, privateMessages]);

  // Load event data
  useEffect(() => {
    if (!uuid) {
      setError('Invalid stream ID');
      setStreamState('error');
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

        // Check if stream URLs exist
        if (!eventData.url && !eventData.screenUrl) {
          setError('Stream not available');
          setStreamState('error');
          return;
        }

        setEvent(eventData);

        // Determine initial stream state based on time
        const now = Date.now();
        const startTime = new Date(eventData.time).getTime();
        const delay = eventData.connectingDelay ?? 30;
        const effectiveStart = startTime + (delay * 1000);

        if (now < startTime) {
          setStreamState('countdown');
        } else if (now < effectiveStart) {
          setStreamState('connecting');
        } else {
          setStreamState('live');
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
    setShowJoinModal(true);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading stream...</p>
        </div>
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

  // Ended state
  if (streamState === 'ended') {
    return <SessionEndedScreen event={event} />;
  }

  // Connecting state
  if (streamState === 'connecting') {
    return (
      <ConnectingScreen
        event={event}
        effectiveStreamStart={effectiveStreamStart}
        onConnectingComplete={handleConnectingComplete}
      />
    );
  }

  // Live state
  return (
    <>
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
        streamStartTime={effectiveStreamStart} // Use effective start (includes connecting delay)
        isChatOpen={isChatOpen}
        onToggleChat={handleToggleChat}
        onStreamEnd={handleStreamEnd}
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
