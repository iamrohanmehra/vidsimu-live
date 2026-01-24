import { useEffect, useRef, useCallback, useState } from 'react';

interface UseStreamSyncOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  streamStartTime: number; // Unix timestamp in ms
  enabled?: boolean;
  onStreamEnd?: () => void;
  isPrimary?: boolean; // Whether this is the primary sync source
  initialTime?: number; // Optimistic initial position (from useOptimisticVideoSync)
}

interface UseStreamSyncReturn {
  syncNow: () => void;
  currentDrift: number;
  expectedTime: number;
  isReady: boolean;
}

// Strict sync parameters as requested
const SYNC_THRESHOLD = 0.5; // Maximum allowed drift in seconds (was 1s)
const SYNC_INTERVAL = 3000; // Check every 3 seconds
const SEEK_THRESHOLD = 0.5; // Threshold below which we don't seek

export function useStreamSync({ 
  videoRef, 
  streamStartTime, 
  enabled = true,
  onStreamEnd,
  isPrimary = true,
  initialTime,
}: UseStreamSyncOptions): UseStreamSyncReturn {
  const lastSyncTimeRef = useRef<number>(0);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentDriftRef = useRef<number>(0);
  const expectedTimeRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const syncAttemptRef = useRef<number>(0);

  // Calculate expected playback time based on schedule
  const getExpectedTime = useCallback(() => {
    if (!streamStartTime) return 0;
    const now = Date.now();
    const elapsed = (now - streamStartTime) / 1000;
    // If stream hasn't started yet, return 0
    return Math.max(0, elapsed);
  }, [streamStartTime]);

  // Sync video to expected timeline
  const syncVideo = useCallback((force = false) => {
    const video = videoRef.current;
    if (!video || !streamStartTime) return;

    // Wait for video metadata to be loaded
    if (!video.duration || !isFinite(video.duration)) {
      return;
    }

    const expectedTime = getExpectedTime();
    expectedTimeRef.current = expectedTime;
    
    // Don't sync if stream hasn't started yet
    if (expectedTime <= 0) {
      return;
    }

    // Check if stream has ended (expected time > video duration)
    if (expectedTime > video.duration) {
      // Stream has ended
      if (isPrimary) {
        onStreamEnd?.();
      }
      return;
    }

    // Don't sync if video is paused and not forced
    if (video.paused && !force) return;

    const currentTime = video.currentTime;
    
    // Use initialTime for the very first seek (optimistic positioning)
    // After that, use regular sync logic
    const targetTime = (initialTime !== undefined && currentTime === 0 && syncAttemptRef.current === 0)
      ? initialTime
      : expectedTime;
    
    const drift = currentTime - targetTime;
    currentDriftRef.current = drift;

    // Only sync if drift exceeds threshold
    const absDrift = Math.abs(drift);
    
    if (force || absDrift >= SYNC_THRESHOLD) {
      // Avoid micro-adjustments for small drifts
      if (absDrift > SEEK_THRESHOLD) {
        // Clamp target time to valid range (0 to video duration)
        const clampedTarget = Math.max(0, Math.min(targetTime, video.duration));
        
        // Only seek if target is valid and different enough
        if (isFinite(clampedTarget) && clampedTarget >= 0) {
          // Check if we can seek to this position (might be unbuffered)
          const buffered = video.buffered;
          let canSeek = false;
          
          for (let i = 0; i < buffered.length; i++) {
            if (clampedTarget >= buffered.start(i) && clampedTarget <= buffered.end(i)) {
              canSeek = true;
              break;
            }
          }
          
          // If we can't seek to the exact position, try to seek to the closest buffered position
          if (!canSeek && buffered.length > 0) {
            // Try to seek to the end of the last buffered range
            const lastBufferedEnd = buffered.end(buffered.length - 1);
            if (clampedTarget > lastBufferedEnd) {
              // Seek to near the end of buffered content, video will continue from there
              video.currentTime = Math.max(0, lastBufferedEnd - 0.5);
              setIsReady(true);
              syncAttemptRef.current++;
              
              if (import.meta.env.DEV && syncAttemptRef.current <= 3) {
                console.log(`[StreamSync] Target ${clampedTarget.toFixed(1)}s not buffered yet, seeking to ${lastBufferedEnd.toFixed(1)}s`);
              }
              return;
            }
          }
          
          // Seek to target
          video.currentTime = clampedTarget;
          lastSyncTimeRef.current = Date.now();
          setIsReady(true);
          
          if (import.meta.env.DEV) {
            const source = initialTime !== undefined && syncAttemptRef.current === 0 ? 'optimistic' : 'calculated';
            console.log(`[StreamSync] Corrected drift of ${drift.toFixed(2)}s → seeking to ${clampedTarget.toFixed(2)}s (${source})`);
          }
        }
      } else {
        // Small drift, considered synced
        setIsReady(true);
      }
    } else {
      // Within threshold, considered synced
      setIsReady(true);
    }
  }, [videoRef, streamStartTime, getExpectedTime, onStreamEnd, isPrimary, initialTime]);

  // Manual sync function exposed to components
  const syncNow = useCallback(() => {
    syncVideo(true);
  }, [syncVideo]);

  // Setup periodic sync check (every 3 seconds)
  useEffect(() => {
    if (!enabled || !streamStartTime) return;

    // Initial sync after video load
    const initialTimer = setTimeout(() => {
      syncVideo(true);
    }, 1000);

    // Periodic sync check every 3 seconds
    syncIntervalRef.current = setInterval(() => {
      syncVideo();
    }, SYNC_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, streamStartTime, syncVideo]);

  // Sync on visibility change (when user returns to tab)
  useEffect(() => {
    if (!enabled || !streamStartTime) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Force sync when returning to tab
        syncAttemptRef.current = 0; // Reset attempt counter
        syncVideo(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, streamStartTime, syncVideo]);

  // Sync on video ready events
  useEffect(() => {
    if (!enabled || !streamStartTime) return;

    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      // Video duration is now available
      syncVideo(true);
    };

    const handleCanPlay = () => {
      syncVideo(true);
    };

    const handlePlaying = () => {
      syncVideo(true);
    };

    const handleSeeked = () => {
      // Verify sync after seeking
      setTimeout(() => {
        const expectedTime = getExpectedTime();
        if (video.duration && expectedTime <= video.duration) {
          const drift = Math.abs(video.currentTime - expectedTime);
          if (drift > SYNC_THRESHOLD) {
            syncVideo(true);
          }
        }
      }, 100);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [enabled, streamStartTime, syncVideo, videoRef, getExpectedTime]);

  return {
    syncNow,
    currentDrift: currentDriftRef.current,
    expectedTime: expectedTimeRef.current,
    isReady,
  };
}
