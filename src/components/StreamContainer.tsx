import type { ReactNode } from 'react';
import { useCallback, useState, useEffect } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { ChatPanel } from './ChatPanel';
import { StreamHeader } from './StreamHeader';
import { PollVoteCard } from './PollVoteCard';
import type { Event, Message } from '@/types';

interface StreamContainerProps {
  event: Event;
  screenUrl: string;
  faceUrl: string;
  muted: boolean;
  onMuteChange: (muted: boolean) => void;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  viewerCount: number;
  streamStartTime: number;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onStreamEnd?: () => void;
  visitorId?: string;
  children?: ReactNode;
  initialSeekTime?: number; // Optimistic seek position for late joiners
}

export function StreamContainer({
  event,
  screenUrl,
  faceUrl,
  muted,
  onMuteChange,
  messages,
  onSendMessage,
  isSending,
  viewerCount,
  streamStartTime,
  isChatOpen,
  onToggleChat,
  onStreamEnd,
  visitorId,
  initialSeekTime,
}: StreamContainerProps) {
  // Toggle mute state
  const handleMuteToggle = useCallback(() => {
    onMuteChange(!muted);
  }, [muted, onMuteChange]);

  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Face Camera Player Component
  const FaceCamPlayer = (
    <VideoPlayer
      url={faceUrl}
      muted={muted}
      onMuteChange={onMuteChange}
      isFaceVideo={true}
      objectFit="contain"
      streamStartTime={streamStartTime}
      isPrimarySync={true}
      onStreamEnd={onStreamEnd}
      initialSeekTime={initialSeekTime}
      className="w-full h-full"
    />
  );

  // Simple toggle for mobile PiP position (Top/Bottom)
  const [isPipTop, setIsPipTop] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black overflow-hidden relative">
      {/* Left Column: Header + Main Video */}
      <div className="w-full md:flex-1 flex flex-col min-w-0 md:h-full shrink-0">
        {/* Header moved inside left column */}
        <div className="shrink-0">
          <StreamHeader
            title={event.title}
            topic={event.topic}
            viewerCount={viewerCount}
            streamStartTime={streamStartTime}
            muted={muted}
            onMuteToggle={handleMuteToggle}
            onToggleChat={onToggleChat}
            isChatOpen={isChatOpen}
          />
        </div>

        {/* Main video area */}
        <div className="relative bg-black md:p-4 w-full aspect-video md:aspect-auto md:flex-1 md:min-h-0 shrink-0 touch-none">
          <VideoPlayer
            url={screenUrl}
            muted={true} // Screen share is ALWAYS muted - audio comes from facecam
            onMuteChange={() => {}} // No-op for screen share
            highestQuality={true}
            isFaceVideo={false}
            objectFit="contain" // Letterbox mode - preserves aspect ratio
            streamStartTime={streamStartTime}
            isPrimarySync={false} // Not the sync source
            initialSeekTime={initialSeekTime}
            className="w-full h-full md:rounded-xl overflow-hidden"
          />

          {/* Mobile Floating Instructor Video (PiP) - Tap to toggle position */}
          {!isDesktop && (
            <div 
              onClick={() => setIsPipTop(!isPipTop)}
              className={`
                absolute right-3 w-28 aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-neutral-800 z-20 cursor-pointer transition-all duration-300 ease-in-out
                ${isPipTop ? 'top-3' : 'bottom-3'}
              `}
            >
              {FaceCamPlayer}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Sidebar (Fixed width on Desktop, Remaining height on Mobile) */}
      <div className={`
        flex flex-col border-t md:border-t-0 md:border-l border-neutral-800 bg-black 
        w-full md:w-[320px] lg:w-[380px] 
        flex-1 md:flex-none md:h-full min-h-0
        ${!isChatOpen ? 'hidden md:flex' : ''} 
      `}>
        {/* Face cam - Desktop placement */}
        {isDesktop && (
          <div className="w-full aspect-video shrink-0 bg-black border-b border-neutral-800">
            {FaceCamPlayer}
          </div>
        )}

        {/* Poll Card (when active) */}
        {visitorId && (
          <div className="px-0 pb-0 shrink-0">
            <PollVoteCard streamId={event.id} visitorId={visitorId} />
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <ChatPanel
            messages={messages}
            onSendMessage={onSendMessage}
            isSending={isSending}
            isOpen={isChatOpen}
          />
        </div>
      </div>
    </div>
  );
}
