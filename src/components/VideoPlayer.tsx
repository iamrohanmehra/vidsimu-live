import { useState, useRef, useCallback, useEffect } from 'react';
import { StreamPlayer, type StreamPlayerRef, type VideoFit } from './StreamPlayer';
import { Button } from '@/components/ui/button';
import { useStreamSync } from '@/hooks/useStreamSync';

interface VideoPlayerProps {
  url: string;
  muted: boolean;
  onMuteChange: (muted: boolean) => void;
  highestQuality?: boolean;
  isFaceVideo?: boolean;
  objectFit?: VideoFit;
  streamStartTime?: number;
  isPrimarySync?: boolean; // Whether this video controls the session end
  onStreamEnd?: () => void;
  initialSeekTime?: number; // Optimistic initial position for late joiners
  className?: string;
}

export function VideoPlayer({
  url,
  muted,
  onMuteChange,
  highestQuality = false,
  isFaceVideo = false,
  objectFit,
  streamStartTime = 0,
  isPrimarySync = false,
  onStreamEnd,
  initialSeekTime,
  className = '',
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showMuteOverlay, setShowMuteOverlay] = useState(true);
  const playerRef = useRef<StreamPlayerRef>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Determine the object-fit mode
  // - Screen share: letterbox (contain) - preserve aspect ratio
  // - Facecam: cover - fill the container
  const resolvedObjectFit: VideoFit = objectFit ?? (isFaceVideo ? 'cover' : 'contain');

  // Setup video sync for timeline-based playback
  useStreamSync({
    videoRef,
    streamStartTime,
    enabled: streamStartTime > 0 && !isLoading,
    onStreamEnd: isPrimarySync ? onStreamEnd : undefined,
    isPrimary: isPrimarySync,
    initialTime: initialSeekTime,
  });

  // Keep videoRef in sync with player's internal ref
  useEffect(() => {
    if (playerRef.current?.video) {
      videoRef.current = playerRef.current.video;
    }
  }, [isLoading]);

  const handleReady = useCallback(() => {
    setIsLoading(false);
    if (playerRef.current?.video) {
      videoRef.current = playerRef.current.video;
    }
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Video error:', error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleJoinAudio = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.setMuted(false);
      onMuteChange(false);
    }
    setShowMuteOverlay(false);
  }, [onMuteChange]);

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Video background for letterbox mode */}
      {resolvedObjectFit === 'contain' && (
        <div className="absolute inset-0 bg-black z-0" />
      )}
      
      <StreamPlayer
        ref={playerRef}
        url={url}
        muted={muted}
        highestQuality={highestQuality}
        objectFit={resolvedObjectFit}
        onReady={handleReady}
        onError={handleError}
        className="relative z-10"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80 text-sm">Connecting to stream...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Failed to load stream</p>
            <p className="text-neutral-400 text-sm">Please refresh the page to try again</p>
          </div>
        </div>
      )}

      {/* Mute overlay - only show on face video (where audio is) */}
      {isFaceVideo && muted && showMuteOverlay && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Button
            onClick={handleJoinAudio}
            size="sm"
            className="bg-white/90 hover:bg-white text-black font-semibold px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Join Audio
          </Button>
        </div>
      )}
    </div>
  );
}
