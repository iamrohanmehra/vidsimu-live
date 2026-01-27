import { useEffect, useRef, useState, useCallback } from 'react';

interface UseBackgroundMusicOptions {
  enabled: boolean;
  sessionStartTime: number; // Unix timestamp in ms when session starts
  onEnded?: () => void;
}

interface TrackInfo {
  id: number;
  duration: number; // in seconds
}

const MUSIC_START_OFFSET_MS = 10 * 60 * 1000; // Music starts 10 minutes before session
const FADE_DURATION_MS = 1000; // 1 second fade in/out

/**
 * Generate a deterministic track order based on session date.
 */
function getTrackOrder(tracks: TrackInfo[], sessionStartTime: number): TrackInfo[] {
  const date = new Date(sessionStartTime);
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  
  const seededRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  // Shuffle using Fisher-Yates with seeded random
  const shuffled = [...tracks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  console.log(`[Music] Track order for ${date.toDateString()}:`, shuffled.slice(0, 5).map(t => t.id), '...');
  return shuffled;
}

/**
 * Calculate which track should be playing and at what position
 */
function calculateSyncState(
  trackOrder: TrackInfo[],
  musicStartTime: number,
  currentTime: number
) {
  if (trackOrder.length === 0) {
    return { trackIndex: 0, seekPosition: 0 };
  }

  const elapsedMs = currentTime - musicStartTime;
  let remainingMs = elapsedMs;
  let trackIndex = 0;

  // Find which track we should be on
  while (trackIndex < trackOrder.length) {
    const trackDurationMs = trackOrder[trackIndex].duration * 1000;
    if (remainingMs < trackDurationMs) {
      break;
    }
    remainingMs -= trackDurationMs;
    trackIndex++;
    // Loop back to start if we've gone through all tracks
    if (trackIndex >= trackOrder.length) {
      trackIndex = 0;
    }
  }

  const seekPosition = remainingMs / 1000; // Convert to seconds
  return { trackIndex: trackIndex % trackOrder.length, seekPosition };
}

export function useBackgroundMusic({ enabled, sessionStartTime, onEnded }: UseBackgroundMusicOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [tracksLoaded, setTracksLoaded] = useState(false);
  
  const trackOrderRef = useRef<TrackInfo[]>([]);
  const currentTrackIndexRef = useRef<number>(0);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const musicStartTimeRef = useRef<number>(0);
  const shouldBePlayingRef = useRef<boolean>(false); // Guard to prevent premature playback
  const canPlayHandlerRef = useRef<(() => void) | null>(null);

  const baseUrl = import.meta.env.VITE_R2_MUSIC_URL || 'https://javascript.design/tracks';

  // Fade volume helper
  const fadeVolume = useCallback((
    audio: HTMLAudioElement,
    targetVolume: number,
    duration: number,
    onComplete?: () => void
  ) => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
    }

    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = 20;
    const stepDuration = duration / steps;
    let step = 0;

    fadeIntervalRef.current = setInterval(() => {
      step++;
      const newVolume = startVolume + (volumeDiff * (step / steps));
      audio.volume = Math.max(0, Math.min(1, newVolume));

      if (step >= steps) {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        onComplete?.();
      }
    }, stepDuration);
  }, []);

  // Play a specific track at a specific position
  const playTrackAt = useCallback((trackIndex: number, seekTo: number = 0) => {
    if (!audioRef.current || !isMountedRef.current || !shouldBePlayingRef.current) return;

    const trackOrder = trackOrderRef.current;
    if (trackOrder.length === 0) return;

    const track = trackOrder[trackIndex % trackOrder.length];
    currentTrackIndexRef.current = trackIndex;

    const trackUrl = `${baseUrl}/${String(track.id).padStart(3, '0')}.mp3`;
    console.log(`[Music] Loading track ${track.id} (${track.duration}s), seek to ${seekTo.toFixed(1)}s`);

    const audio = audioRef.current;
    
    // Cleanup previous listener if exists
    if (canPlayHandlerRef.current) {
      audio.removeEventListener('canplay', canPlayHandlerRef.current);
    }

    audio.src = trackUrl;
    audio.volume = 0;

    const handleCanPlay = () => {
      // Cleanup self
      audio.removeEventListener('canplay', handleCanPlay);
      canPlayHandlerRef.current = null;

      if (!isMountedRef.current || !audioRef.current || !shouldBePlayingRef.current) return;
      
      // Verify we are still on the same track index (prevents race conditions)
      if (currentTrackIndexRef.current !== trackIndex) return;

      // Seek to position
      if (seekTo > 0 && seekTo < track.duration - 1) {
        audio.currentTime = seekTo;
      }

      audio.play()
        .then(() => {
          if (!isMountedRef.current) return;
          console.log(`[Music] ✅ Playing track ${track.id} from ${audio.currentTime.toFixed(1)}s`);
          setIsPlaying(true);
          setCurrentTrack(track.id);
          fadeVolume(audio, 0.3, FADE_DURATION_MS);
        })
        .catch((error) => {
          // AbortError is common when we switch tracks quickly, ignore it
          if (error.name === 'AbortError') return;
          
          console.error('[Music] ❌ Autoplay failed:', error.message);
          setIsPlaying(false);
          
          // Try next track immediately on play error
          if (shouldBePlayingRef.current) {
            currentTrackIndexRef.current++;
            playTrackAt(currentTrackIndexRef.current, 0);
          }
        });
    };

    canPlayHandlerRef.current = handleCanPlay;
    audio.addEventListener('canplay', handleCanPlay);
    audio.load();
  }, [baseUrl, fadeVolume]);

  // Handle track end
  const handleTrackEnd = useCallback(() => {
    if (!isMountedRef.current || !shouldBePlayingRef.current) return;
    console.log('[Music] Track ended, playing next...');
    currentTrackIndexRef.current++;
    playTrackAt(currentTrackIndexRef.current, 0);
  }, [playTrackAt]);

  // Start music playback with sync
  const startMusic = useCallback(() => {
    if (!isMountedRef.current || !tracksLoaded) return;

    const musicStartTime = musicStartTimeRef.current;
    const now = Date.now();

    if (now < musicStartTime || now >= sessionStartTime) return;

    // Enable playback
    shouldBePlayingRef.current = true;

    const { trackIndex, seekPosition } = calculateSyncState(
      trackOrderRef.current,
      musicStartTime,
      now
    );

    console.log(`[Music] Starting at track index ${trackIndex}, position ${seekPosition.toFixed(1)}s`);
    playTrackAt(trackIndex, seekPosition);
  }, [tracksLoaded, sessionStartTime, playTrackAt]);

  const stopPlayback = useCallback(() => {
    shouldBePlayingRef.current = false; // Disable playback
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (audioRef.current) {
      const audio = audioRef.current;
      fadeVolume(audio, 0, FADE_DURATION_MS / 2, () => {
        audio.pause();
        audio.src = '';
      });
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  }, [fadeVolume]);

  // Fetch track metadata and initialize
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || !sessionStartTime) {
      console.log('[Music] Disabled');
      stopPlayback();
      return;
    }

    const musicStartTime = sessionStartTime - MUSIC_START_OFFSET_MS;
    musicStartTimeRef.current = musicStartTime;
    const now = Date.now();

    // If session already started, don't play
    if (now >= sessionStartTime) {
      console.log('[Music] Session already started');
      return;
    }

    // Fetch tracks.json
    const fetchTracks = async () => {
      try {
        const response = await fetch(`${baseUrl}/tracks.json`);
        const data = await response.json();
        const tracks: TrackInfo[] = data.tracks;
        
        console.log(`[Music] ✅ Loaded ${tracks.length} tracks from metadata`);
        trackOrderRef.current = getTrackOrder(tracks, sessionStartTime);
        setTracksLoaded(true);
      } catch {
        console.warn('[Music] ⚠️ Failed to fetch tracks.json (CORS or network issue)');
        console.log('[Music] Using fallback: assuming 3min per track');
        
        // Fallback: create fake track metadata with assumed 180s duration
        const fallbackTracks: TrackInfo[] = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          duration: 180 // 3 minutes
        }));
        
        trackOrderRef.current = getTrackOrder(fallbackTracks, sessionStartTime);
        setTracksLoaded(true);
      }

      const currentTime = Date.now();
      
      if (currentTime >= musicStartTime) {
        // We're already in the music window - create audio element and start immediately
        if (!audioRef.current) {
          audioRef.current = new Audio();
          audioRef.current.addEventListener('ended', handleTrackEnd);
          audioRef.current.addEventListener('error', (e) => {
            console.error('[Music] Error:', e);
            // Only try next track if we're supposed to be playing
            if (shouldBePlayingRef.current) {
              setTimeout(() => {
                currentTrackIndexRef.current++;
                playTrackAt(currentTrackIndexRef.current, 0);
              }, 500);
            }
          });
        }
        startMusic();
      } else {
        // Schedule music start - create audio element just before we need it
        const delay = musicStartTime - currentTime;
        console.log(`[Music] Scheduling start in ${Math.round(delay / 1000)}s`);
        
        // Create audio element 5 seconds before music starts to avoid initialization errors
        const audioInitDelay = Math.max(0, delay - 5000);
        
        const initTimer = setTimeout(() => {
          if (!audioRef.current && isMountedRef.current) {
            console.log('[Music] Initializing audio element');
            audioRef.current = new Audio();
            audioRef.current.addEventListener('ended', handleTrackEnd);
            audioRef.current.addEventListener('error', (e) => {
              console.error('[Music] Error:', e);
              // Only try next track if we're supposed to be playing
              if (shouldBePlayingRef.current) {
                setTimeout(() => {
                  currentTrackIndexRef.current++;
                  playTrackAt(currentTrackIndexRef.current, 0);
                }, 500);
              }
            });
          }
        }, audioInitDelay);
        
        startTimerRef.current = setTimeout(startMusic, delay);
        
        // Store init timer for cleanup
        return () => {
          clearTimeout(initTimer);
        };
      }
    };

    fetchTracks();

    return () => {
      console.log('[Music] Cleanup');
      isMountedRef.current = false;
      stopPlayback();
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current = null;
      }
    };
  }, [enabled, sessionStartTime, baseUrl, handleTrackEnd, playTrackAt, startMusic, stopPlayback]);

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
