import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import Hls from 'hls.js';

export type VideoFit = 'cover' | 'contain' | 'fill';

interface StreamPlayerProps {
  url: string;
  muted?: boolean;
  autoPlay?: boolean;
  highestQuality?: boolean;
  objectFit?: VideoFit;
  onReady?: () => void;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export interface StreamPlayerRef {
  video: HTMLVideoElement | null;
  play: () => Promise<void>;
  pause: () => void;
  setMuted: (muted: boolean) => void;
  getCurrentTime: () => number;
  setCurrentTime: (time: number) => void;
  syncTo: (time: number) => void;
}

export const StreamPlayer = forwardRef<StreamPlayerRef, StreamPlayerProps>(
  ({ 
    url, 
    muted = true, 
    autoPlay = true, 
    highestQuality = false, 
    objectFit = 'contain', // Default to letterbox
    onReady, 
    onError, 
    onTimeUpdate,
    className = '' 
  }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    // Get object-fit class based on prop
    const getObjectFitClass = useCallback(() => {
      switch (objectFit) {
        case 'cover':
          return 'object-cover';
        case 'fill':
          return 'object-fill';
        case 'contain':
        default:
          return 'object-contain';
      }
    }, [objectFit]);

    useImperativeHandle(ref, () => ({
      video: videoRef.current,
      play: async () => {
        if (videoRef.current) {
          await videoRef.current.play();
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      },
      setMuted: (value: boolean) => {
        if (videoRef.current) {
          videoRef.current.muted = value;
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
      setCurrentTime: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      syncTo: (time: number) => {
        if (videoRef.current && Math.abs(videoRef.current.currentTime - time) > 0.5) {
          videoRef.current.currentTime = time;
        }
      },
    }));

    // Handle time updates
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !onTimeUpdate) return;

      const handleTimeUpdate = () => {
        onTimeUpdate(video.currentTime);
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }, [onTimeUpdate]);

    useEffect(() => {
      if (!url) return;

      const video = videoRef.current;
      if (!video) return;

      // Check for native HLS support (Safari)
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          onReady?.();
          if (autoPlay) {
            video.play().catch(console.error);
          }
        });
        return;
      }

      // Use HLS.js for other browsers
      if (Hls.isSupported()) {
        const hls = new Hls({
          // Start with auto level selection
          startLevel: -1,
          // Buffer settings
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5,
          // VOD/Simulive settings (not live stream)
          liveSyncDuration: undefined,
          liveMaxLatencyDuration: undefined,
          liveDurationInfinity: false,
          // Enable fast seeking
          nudgeMaxRetry: 3,
          nudgeOffset: 0.1,
          // Worker for performance
          enableWorker: true,
          // Important for VOD seeking
          startPosition: -1, // Start at beginning if no seek
          initialLiveManifestSize: 1,
        });

        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          // Select highest quality if requested (for main screen)
          if (highestQuality && data.levels.length > 0) {
            hls.currentLevel = data.levels.length - 1;
          }
          
          onReady?.();
          if (autoPlay) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal error, destroying HLS...');
                hls.destroy();
                onError?.('Failed to load video stream');
                break;
            }
          }
        });

        return () => {
          hls.destroy();
          hlsRef.current = null;
        };
      } else {
        onError?.('HLS is not supported in this browser');
      }
    }, [url, autoPlay, highestQuality, onReady, onError]);

    return (
      <video
        ref={videoRef}
        muted={muted}
        playsInline
        autoPlay={autoPlay}
        className={`w-full h-full ${getObjectFitClass()} ${className || ''}`}
      />
    );
  }
);

StreamPlayer.displayName = 'StreamPlayer';
