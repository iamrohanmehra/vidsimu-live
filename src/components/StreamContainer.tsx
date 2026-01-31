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
  userName?: string;
  userEmail?: string;
  children?: ReactNode;
  initialSeekTime?: number; // Optimistic seek position for late joiners
  onVideoReady?: () => void;
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
  onStreamEnd,
  visitorId,
  userName,
  userEmail,
  initialSeekTime,
  onVideoReady,
}: StreamContainerProps) {
  // Toggle mute state
  const handleMuteToggle = useCallback(() => {
    onMuteChange(!muted);
  }, [muted, onMuteChange]);



  // Track video readiness
  const [faceReady, setFaceReady] = useState(false);
  const [screenReady, setScreenReady] = useState(false);

  // Check if all active videos are ready
  // - If screenUrl exists, we need BOTH face and screen to be ready
  // - If no screenUrl, we only need face to be ready
  useEffect(() => {
    const isScreenActive = !!screenUrl;
    
    if (isScreenActive) {
      if (faceReady && screenReady) {
        onVideoReady?.();
      }
    } else {
      if (faceReady) {
        onVideoReady?.();
      }
    }
  }, [faceReady, screenReady, screenUrl, onVideoReady]);

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
      instructorName={event.instructor || 'Ashish Shukla'}
      onSyncReady={() => setFaceReady(true)}
    />
  );

  // Simple toggle for mobile PiP position (Top/Bottom)
  const [isPipTop, setIsPipTop] = useState(false);

  return (
    <div className="grid grid-cols-1 grid-rows-[auto_auto_1fr] md:flex md:flex-row h-screen bg-black overflow-hidden relative">
      {/* Left Column: Header + Main Video */}
      <div className="contents md:flex md:flex-col md:w-full md:flex-1 md:min-w-0 md:h-full md:shrink-0">
        {/* Header moved inside left column */}
        <div className="md:shrink-0">
          <StreamHeader
            title={event.title}
            topic={event.topic}
            viewerCount={viewerCount}
            streamStartTime={streamStartTime}
            muted={muted}
            onMuteToggle={handleMuteToggle}
          />
        </div>

        {/* Main video area */}
        <div className="relative bg-black md:p-4 w-full aspect-video md:aspect-auto md:flex-1 md:min-h-0 shrink-0 touch-none row-start-2 col-start-1 z-0">
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
            instructorName={!screenUrl ? (event.instructor || 'Ashish Shukla') : undefined}
            onSyncReady={() => setScreenReady(true)}
          />
        </div>
      </div>

      {/* Right Column: Sidebar (Fixed width on Desktop, containing FaceCam and Chat) */}
      <div className={`
        contents 
        md:flex md:flex-col md:border-t-0 md:border-l md:border-neutral-800 md:bg-neutral-900 
        md:w-[350px] 
        md:flex-none md:h-full md:min-h-0
        ${!isChatOpen ? 'md:hidden' : ''} 
      `}>
        {/* Face cam - Responsive Placement (PiP on Mobile, Static Block on Desktop) */}
        <div 
          onClick={() => setIsPipTop(!isPipTop)}
          className={`
            bg-black overflow-hidden transition-all duration-300 ease-in-out relative group
            
            /* Mobile Styles (Floating PiP in Grid Cell) */
            row-start-2 col-start-1 z-20 w-28 aspect-video rounded-lg shadow-lg border border-neutral-800 cursor-pointer justify-self-end m-3
            ${isPipTop ? 'self-start mt-3' : 'self-end mb-3'}

            /* Desktop Styles (Reset to Static Sidebar Block) */
            md:relative md:w-full md:aspect-video md:rounded-none md:shadow-none md:border-0 md:border-b md:border-neutral-800 md:z-auto md:cursor-default md:m-0 md:self-auto md:justify-self-auto
          `}
        >
          {FaceCamPlayer}
        </div>

        {/* Sidebar Content (Poll + Chat) */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 row-start-3 md:row-auto">
          {/* Poll Card (when active) */}
          {visitorId && (
            <div className="px-0 pb-0 shrink-0 border-t border-neutral-800 md:border-t-0">
              <PollVoteCard streamId={event.id} visitorId={visitorId} userName={userName} userEmail={userEmail} />
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
    </div>
  );
}
