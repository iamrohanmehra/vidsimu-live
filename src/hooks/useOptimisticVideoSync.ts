import { useState, useEffect, useCallback, useRef } from 'react';
import Hls from 'hls.js';

export type SyncConfidence = 'low' | 'medium' | 'high';

interface OptimisticSyncState {
  estimatedTime: number; // Immediate calculation from Date.now()
  accurateTime: number | null; // Verified time from HLS manifest
  syncConfidence: SyncConfidence;
  isReady: boolean; // True when confidence is 'high'
  drift: number; // Difference between estimated and accurate
}

interface UseOptimisticVideoSyncOptions {
  streamStartTime: number; // Unix timestamp in ms
  videoUrl?: string; // HLS manifest URL for accurate duration check
  enabled?: boolean;
}

/**
 * Hook for optimistic video sync with two-phase approach:
 * Phase 1: Calculate estimated position immediately (no delays)
 * Phase 2: Fetch HLS manifest for accurate verification in background
 */
export function useOptimisticVideoSync({
  streamStartTime,
  videoUrl,
  enabled = true,
}: UseOptimisticVideoSyncOptions): OptimisticSyncState {
  const [state, setState] = useState<OptimisticSyncState>({
    estimatedTime: 0,
    accurateTime: null,
    syncConfidence: 'low',
    isReady: false,
    drift: 0,
  });

  const hlsRef = useRef<Hls | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Phase 1: Calculate estimated position (instant)
  const calculateEstimatedTime = useCallback(() => {
    if (!streamStartTime) return 0;
    const now = Date.now();
    const elapsed = (now - streamStartTime) / 1000;
    return Math.max(0, elapsed);
  }, [streamStartTime]);

  // Phase 2: Get accurate time from HLS manifest
  useEffect(() => {
    if (!enabled || !videoUrl || !streamStartTime) {
      return;
    }

    // Immediately calculate and set estimated time
    const estimatedTime = calculateEstimatedTime();
    setState(prev => ({
      ...prev,
      estimatedTime,
      syncConfidence: 'medium', // We have an estimate
    }));

    if (import.meta.env.DEV) {
      console.log('[OptimisticSync] Estimated position:', estimatedTime.toFixed(2) + 's');
    }

    // Now fetch accurate duration in background
    const video = document.createElement('video');
    videoRef.current = video;

    const handleDurationReady = (duration: number) => {
      // Recalculate current expected time (may have changed since initial estimate)
      const currentEstimatedTime = calculateEstimatedTime();
      
      // Check if we're still within valid range
      if (currentEstimatedTime > duration) {
        // Stream has ended
        setState(prev => ({
          ...prev,
          estimatedTime: currentEstimatedTime,
          accurateTime: duration,
          syncConfidence: 'high',
          isReady: true,
          drift: currentEstimatedTime - duration,
        }));
        return;
      }

      // Calculate drift between estimate and accurate
      const drift = Math.abs(currentEstimatedTime - estimatedTime);
      
      // High confidence if drift is minimal (< 500ms)
      const confidence: SyncConfidence = drift < 0.5 ? 'high' : 'medium';

      setState(prev => ({
        ...prev,
        estimatedTime: currentEstimatedTime,
        accurateTime: currentEstimatedTime,
        syncConfidence: confidence,
        isReady: confidence === 'high',
        drift,
      }));

      if (import.meta.env.DEV) {
        console.log(
          `[OptimisticSync] Accurate sync ready | Position: ${currentEstimatedTime.toFixed(2)}s | ` +
          `Duration: ${duration.toFixed(2)}s | Drift: ${drift.toFixed(3)}s | Confidence: ${confidence}`
        );
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1,
        capLevelToPlayerSize: true, // Don't load high res for metadata
      });
      hlsRef.current = hls;

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (video.duration && isFinite(video.duration)) {
          handleDurationReady(video.duration);
        }
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        if (data.details?.totalduration) {
          handleDurationReady(data.details.totalduration);
        }
      });

      video.addEventListener('durationchange', () => {
        if (video.duration && isFinite(video.duration)) {
          handleDurationReady(video.duration);
        }
      });

      video.addEventListener('loadedmetadata', () => {
        if (video.duration && isFinite(video.duration)) {
          handleDurationReady(video.duration);
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = videoUrl;
      
      video.addEventListener('loadedmetadata', () => {
        if (video.duration && isFinite(video.duration)) {
          handleDurationReady(video.duration);
        }
      });

      video.addEventListener('durationchange', () => {
        if (video.duration && isFinite(video.duration)) {
          handleDurationReady(video.duration);
        }
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.src = '';
        videoRef.current = null;
      }
    };
  }, [enabled, videoUrl, streamStartTime, calculateEstimatedTime]);

  // Update estimated time periodically (every second) to keep it current
  useEffect(() => {
    if (!enabled || !streamStartTime) return;

    const interval = setInterval(() => {
      const newEstimatedTime = calculateEstimatedTime();
      setState(prev => ({
        ...prev,
        estimatedTime: newEstimatedTime,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, streamStartTime, calculateEstimatedTime]);

  return state;
}
