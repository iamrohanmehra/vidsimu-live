import { useState, useRef, useCallback, useEffect } from 'react';
import { StreamPlayer, type StreamPlayerRef, type VideoFit } from './StreamPlayer';

interface PreviewVideoPlayerProps {
  url: string;
  muted: boolean;
  onMuteChange: (muted: boolean) => void;
  isFaceVideo?: boolean;
  objectFit?: VideoFit;
  onSeek?: (time: number) => void; // Notify parent when seeking happens
  syncToTime?: number; // External time to sync to
  className?: string;
}

export function PreviewVideoPlayer({
  url,
  muted,
  isFaceVideo = false,
  objectFit,
  onSeek,
  syncToTime,
  className = '',
}: PreviewVideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<StreamPlayerRef>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isSyncingRef = useRef(false);

  // Determine the object-fit mode
  const resolvedObjectFit: VideoFit = objectFit ?? (isFaceVideo ? 'cover' : 'contain');

  // Keep videoRef in sync with player's internal ref
  useEffect(() => {
    if (playerRef.current?.video) {
      videoRef.current = playerRef.current.video;
    }
  }, [isLoading]);

  // Sync to external time (for facecam syncing to screen share)
  useEffect(() => {
    if (syncToTime !== undefined && videoRef.current && !isSyncingRef.current) {
      const drift = Math.abs(videoRef.current.currentTime - syncToTime);
      
      // Only sync if drift is significant
      if (drift > 0.5) {
        isSyncingRef.current = true;
        videoRef.current.currentTime = syncToTime;
        console.log(`[PreviewSync] ${isFaceVideo ? 'Facecam' : 'Screen'} synced to ${syncToTime.toFixed(2)}s`);
        
        // Reset sync flag after a brief delay
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 100);
      }
    }
  }, [syncToTime, isFaceVideo]);

  const handleReady = useCallback(() => {
    setIsLoading(false);
    if (playerRef.current?.video) {
      videoRef.current = playerRef.current.video;
      setDuration(playerRef.current.video.duration || 0);
      
      // Start from beginning
      playerRef.current.video.currentTime = 0;
    }
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Video error:', error);
    setHasError(true);
    setIsLoading(false);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Only the primary player (screen share) emits seek events
    if (onSeek && !isSyncingRef.current) {
      onSeek(time);
    }
  }, [onSeek]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative w-full h-full bg-black ${className}`}>
      {/* Video background for letterbox mode */}
      {resolvedObjectFit === 'contain' && (
        <div className="absolute inset-0 bg-neutral-950 z-0" />
      )}
      
      <StreamPlayer
        ref={playerRef}
        url={url}
        muted={muted}
        highestQuality={!isFaceVideo}
        objectFit={resolvedObjectFit}
        onReady={handleReady}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        className="relative z-10"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/80 text-sm">Loading video...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-2">Failed to load video</p>
            <p className="text-neutral-400 text-sm">Check if the video URL is valid</p>
          </div>
        </div>
      )}

      {/* Timestamp overlay (only for screen share - primary player) */}
      {!isFaceVideo && !isLoading && !hasError && (
        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-lg z-20">
          <div className="text-white text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}

      {/* Seek bar (only for screen share - primary player) */}
      {!isFaceVideo && !isLoading && !hasError && duration > 0 && (
        <div className="absolute bottom-16 left-4 right-4 z-20">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
