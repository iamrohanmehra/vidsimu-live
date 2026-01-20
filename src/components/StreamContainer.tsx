import type { ReactNode } from 'react';
import { useCallback } from 'react';
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
}: StreamContainerProps) {
  // Toggle mute state
  const handleMuteToggle = useCallback(() => {
    onMuteChange(!muted);
  }, [muted, onMuteChange]);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header with mute toggle */}
      <StreamHeader
        title={event.title}
        viewerCount={viewerCount}
        streamStartTime={streamStartTime}
        muted={muted}
        onMuteToggle={handleMuteToggle}
        onToggleChat={onToggleChat}
        isChatOpen={isChatOpen}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Main video (screen share) - 2/3 width on desktop */}
        {/* Uses letterbox (object-contain) to preserve aspect ratio */}
        {/* Screen share has NO audio - audio comes from facecam */}
        <div className="flex-1 md:w-2/3 relative bg-neutral-950">
          <VideoPlayer
            url={screenUrl}
            muted={true} // Screen share is ALWAYS muted - audio comes from facecam
            onMuteChange={() => {}} // No-op for screen share
            highestQuality={true}
            isFaceVideo={false}
            objectFit="contain" // Letterbox mode - preserves aspect ratio
            streamStartTime={streamStartTime}
            isPrimarySync={false} // Not the sync source
            className="w-full h-full"
          />
        </div>

        {/* Side panel (face cam + chat) - 1/3 width on desktop */}
        <div className={`
          md:w-1/3 md:max-w-md flex flex-col border-l border-neutral-800
          ${isChatOpen ? 'h-1/2 md:h-full' : 'h-auto'}
          absolute md:relative inset-x-0 bottom-0 md:inset-auto
          bg-neutral-900 md:bg-transparent
          transition-transform duration-300
          ${isChatOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
        `}>
          {/* Face cam - Contains audio, syncs playback */}
          <div className="h-48 md:h-64 shrink-0 p-2">
            <div className="h-full rounded-xl overflow-hidden bg-neutral-950">
              <VideoPlayer
                url={faceUrl}
                muted={muted} // Facecam has audio - controlled by mute state
                onMuteChange={onMuteChange}
                isFaceVideo={true}
                objectFit="cover" // Cover mode - fills container
                streamStartTime={streamStartTime}
                isPrimarySync={true} // Facecam controls session end
                onStreamEnd={onStreamEnd}
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Poll Card (when active) */}
          {visitorId && (
            <div className="px-2 pb-2">
              <PollVoteCard streamId={event.id} visitorId={visitorId} />
            </div>
          )}

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatPanel
              messages={messages}
              onSendMessage={onSendMessage}
              isSending={isSending}
              isOpen={isChatOpen}
              onClose={onToggleChat}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
