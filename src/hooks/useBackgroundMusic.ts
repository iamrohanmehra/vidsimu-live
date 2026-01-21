import { useEffect, useRef, useState, useCallback } from 'react';

interface UseBackgroundMusicOptions {
  enabled: boolean;
  sessionStartTime: number; // Unix timestamp in ms when session starts
  onEnded?: () => void;
}

const TRACK_DURATION_MS = 3 * 60 * 1000; // Assume 3 minutes per track for sync calculation
const MUSIC_START_OFFSET_MS = 10 * 60 * 1000; // Music starts 10 minutes before session
const SYNC_INTERVAL_MS = 5000; // Re-sync every 5 seconds to handle drift
const TRACK_COUNT = 50;

/**
 * Generate a deterministic track order based on session date.
 * Same session = same order for all users.
 * Different session (date) = different order.
 */
function getTrackOrder(sessionStartTime: number): number[] {
  // Use the session date (YYYYMMDD) as seed for deterministic shuffle
  const date = new Date(sessionStartTime);
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  
  // Simple seeded random using the date
  const seededRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  // Create and shuffle track array using Fisher-Yates with seeded random
  const tracks = Array.from({ length: TRACK_COUNT }, (_, i) => i + 1);
  for (let i = tracks.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(i) * (i + 1));
    [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
  }
  
  console.log(`[Sync Music] Track order for ${date.toDateString()}:`, tracks);
  return tracks;
}

/**
 * Calculate which track should be playing and at what position
 * based on the session start time and current time.
 */
function calculateSyncState(sessionStartTime: number, currentTime: number) {
  const musicStartTime = sessionStartTime - MUSIC_START_OFFSET_MS;
  
  // If current time is before music should start
  if (currentTime < musicStartTime) {
    return {
      shouldPlay: false,
      trackIndex: -1,
      trackNumber: 0,
      seekPosition: 0,
      timeUntilMusicStart: musicStartTime - currentTime,
    };
  }
  
  // If current time is at or after session start (countdown complete)
  if (currentTime >= sessionStartTime) {
    return {
      shouldPlay: false,
      trackIndex: -1,
      trackNumber: 0,
      seekPosition: 0,
      timeUntilMusicStart: 0,
    };
  }
  
  // Get track order for this session date
  const trackOrder = getTrackOrder(sessionStartTime);
  
  // Calculate elapsed time since music started
  const elapsedMs = currentTime - musicStartTime;
  
  // Calculate which track should be playing (cycling through trackOrder)
  const totalTrackIndex = Math.floor(elapsedMs / TRACK_DURATION_MS);
  const trackIndex = totalTrackIndex % trackOrder.length;
  const trackNumber = trackOrder[trackIndex];
  
  // Calculate position within current track
  const seekPosition = (elapsedMs % TRACK_DURATION_MS) / 1000; // in seconds
  
  return {
    shouldPlay: true,
    trackIndex,
    trackNumber,
    seekPosition,
    timeUntilMusicStart: 0,
  };
}

export function useBackgroundMusic({ enabled, sessionStartTime, onEnded }: UseBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const lastTrackIndexRef = useRef<number>(-1);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const baseUrl = import.meta.env.VITE_R2_MUSIC_URL || 'https://javascript.design/tracks';

  const playTrack = useCallback((trackNumber: number, seekTo: number = 0) => {
    if (!audioRef.current) return;
    
    const trackUrl = `${baseUrl}/${String(trackNumber).padStart(3, '0')}.mp3`;
    
    console.log(`[Sync Music] Loading track ${trackNumber}: ${trackUrl}`);
    
    // Prevent overlapping audio
    audioRef.current.pause();
    audioRef.current.src = trackUrl;
    
    // Set up metadata loaded handler to seek after loading
    const handleMetadata = () => {
      if (audioRef.current && seekTo > 0) {
        const clampedSeek = Math.min(seekTo, audioRef.current.duration || seekTo);
        console.log(`[Sync Music] Seeking to ${clampedSeek.toFixed(1)}s`);
        audioRef.current.currentTime = clampedSeek;
      }
      
      audioRef.current?.play()
        .then(() => {
          console.log(`[Sync Music] ✅ Playing track ${trackNumber} from ${seekTo.toFixed(1)}s`);
          setIsPlaying(true);
          setCurrentTrack(trackNumber);
        })
        .catch((error) => {
          console.error('[Sync Music] ❌ Autoplay failed:', error.message);
          console.log('[Sync Music] 💡 Click anywhere on the page to enable audio');
          setIsPlaying(false);
        });
      
      audioRef.current?.removeEventListener('loadedmetadata', handleMetadata);
    };
    
    audioRef.current.addEventListener('loadedmetadata', handleMetadata);
    audioRef.current.load();
  }, [baseUrl]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  }, []);

  const syncPlayback = useCallback(() => {
    const now = Date.now();
    const state = calculateSyncState(sessionStartTime, now);
    
    if (!state.shouldPlay) {
      if (state.timeUntilMusicStart > 0) {
        console.log(`[Sync Music] Music starts in ${Math.round(state.timeUntilMusicStart / 1000)}s`);
      }
      stopPlayback();
      return;
    }
    
    // Check if we need to switch tracks
    if (state.trackIndex !== lastTrackIndexRef.current) {
      console.log(`[Sync Music] Track change: index ${lastTrackIndexRef.current} → ${state.trackIndex}`);
      lastTrackIndexRef.current = state.trackIndex;
      playTrack(state.trackNumber, state.seekPosition);
    } else if (audioRef.current && !audioRef.current.paused) {
      // Verify sync - correct if drift is more than 2 seconds
      const currentPos = audioRef.current.currentTime;
      const expectedPos = state.seekPosition;
      const drift = Math.abs(currentPos - expectedPos);
      
      if (drift > 2) {
        console.log(`[Sync Music] Correcting drift: ${drift.toFixed(1)}s (${currentPos.toFixed(1)}s → ${expectedPos.toFixed(1)}s)`);
        audioRef.current.currentTime = expectedPos;
      }
    }
  }, [sessionStartTime, playTrack, stopPlayback]);

  useEffect(() => {
    if (!enabled || !sessionStartTime) {
      console.log('[Sync Music] Disabled - stopping playback');
      stopPlayback();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      return;
    }

    const musicStartTime = sessionStartTime - MUSIC_START_OFFSET_MS;
    console.log(`[Sync Music] Enabled - music starts at ${new Date(musicStartTime).toLocaleTimeString()}`);
    console.log(`[Sync Music] Session starts at ${new Date(sessionStartTime).toLocaleTimeString()}`);

    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3;
      console.log('[Sync Music] Volume set to 30%');
      
      // Handle track end - sync will pick up the next track
      audioRef.current.addEventListener('ended', () => {
        console.log('[Sync Music] Track ended naturally, syncing next...');
        syncPlayback();
      });

      // Handle errors
      audioRef.current.addEventListener('error', (e) => {
        console.error('[Sync Music] Error:', e);
        setIsPlaying(false);
      });
    }

    // Initial sync
    syncPlayback();

    // Set up periodic sync to handle drift and track changes
    syncIntervalRef.current = setInterval(syncPlayback, SYNC_INTERVAL_MS);

    return () => {
      console.log('[Sync Music] Cleanup');
      stopPlayback();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      lastTrackIndexRef.current = -1;
    };
  }, [enabled, sessionStartTime, syncPlayback, stopPlayback]);

  // Call onEnded when disabled
  useEffect(() => {
    if (!enabled && onEnded) {
      onEnded();
    }
  }, [enabled, onEnded]);

  return {
    isPlaying,
    currentTrack,
    stopPlayback,
  };
}
