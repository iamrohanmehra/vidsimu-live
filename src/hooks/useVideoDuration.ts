import { useState, useEffect } from 'react';
import Hls from 'hls.js';

export function useVideoDuration(url?: string) {
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    if (!url) return;

    let hls: Hls | null = null;
    const video = document.createElement('video');

    const handleDuration = () => {
      if (video.duration && video.duration !== Infinity && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };

    if (Hls.isSupported()) {
      hls = new Hls({
        autoStartLoad: true,
        startLevel: -1, // Auto
        capLevelToPlayerSize: true, // Don't load high res for metadata
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Sometimes duration is available immediately
        handleDuration();
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        if (data.details?.totalduration) {
          setDuration(data.details.totalduration);
        }
      });

      video.addEventListener('durationchange', handleDuration);
      video.addEventListener('loadedmetadata', handleDuration);

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = url;
      video.addEventListener('loadedmetadata', handleDuration);
      video.addEventListener('durationchange', handleDuration);
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener('durationchange', handleDuration);
      video.removeEventListener('loadedmetadata', handleDuration);
      video.src = '';
    };
  }, [url]);

  return duration;
}
