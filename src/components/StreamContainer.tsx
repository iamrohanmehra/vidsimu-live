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
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Left Column: Header + Main Video */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header moved inside left column */}
        <StreamHeader
          title={event.title}
          viewerCount={viewerCount}
          streamStartTime={streamStartTime}
          muted={muted}
          onMuteToggle={handleMuteToggle}
          onToggleChat={onToggleChat}
          isChatOpen={isChatOpen}
        />

        {/* Main video area */}
        <div className="flex-1 relative bg-neutral-950 p-2 min-h-0">
          <VideoPlayer
            url={screenUrl}
            muted={true} // Screen share is ALWAYS muted - audio comes from facecam
            onMuteChange={() => {}} // No-op for screen share
            highestQuality={true}
            isFaceVideo={false}
            objectFit="contain" // Letterbox mode - preserves aspect ratio
            streamStartTime={streamStartTime}
            isPrimarySync={false} // Not the sync source
            className="w-full h-full rounded-xl overflow-hidden"
          />
        </div>
      </div>

      {/* Right Column: Sidebar (Fixed width, Full Height) */}
      <div className="w-full md:w-1/4 md:max-w-sm flex flex-col border-l border-neutral-800 h-full bg-neutral-900 shrink-0">
        {/* Face cam - Contains audio, syncs playback */}
        <div className="h-48 md:h-64 shrink-0">
          <div className="h-full bg-neutral-950">
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
          />
        </div>
      </div>
    </div>
  );
}
