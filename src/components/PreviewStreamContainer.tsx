import { useState } from 'react';
import { PreviewVideoPlayer } from './PreviewVideoPlayer';
import type { Event } from '@/types';

interface PreviewStreamContainerProps {
  event: Event;
  screenUrl: string;
  faceUrl: string;
}

export function PreviewStreamContainer({
  event,
  screenUrl,
  faceUrl,
}: PreviewStreamContainerProps) {
  const [muted, setMuted] = useState(true);
  const [screenShareTime, setScreenShareTime] = useState(0);

  // Screen share is the primary - when it seeks, sync facecam to it
  const handleScreenSeek = (time: number) => {
    setScreenShareTime(time);
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Left Column: Header + Main Video */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs font-semibold text-yellow-500 uppercase tracking-wide">Preview Mode</span>
              </div>
              <h1 className="text-lg font-bold text-white">{event.title}</h1>
            </div>

            {/* Mute toggle */}
            <button
              onClick={() => setMuted(!muted)}
              className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? (
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Main video area - Screen Share */}
        <div className="flex-1 relative bg-neutral-950 p-2 min-h-0">
          <PreviewVideoPlayer
            url={screenUrl}
            muted={true} // Screen share is always muted
            onMuteChange={() => {}}
            isFaceVideo={false}
            objectFit="contain"
            onSeek={handleScreenSeek} // Primary player - emits seek events
            className="w-full h-full rounded-xl overflow-hidden"
          />
        </div>
      </div>

      {/* Right Column: Facecam (Fixed width, Full Height) */}
      <div className="w-full md:w-1/4 md:max-w-sm flex flex-col border-l border-neutral-800 h-full bg-neutral-900 shrink-0">
        {/* Face cam - Syncs to screen share time */}
        <div className="h-48 md:h-64 shrink-0">
          <div className="h-full bg-neutral-950">
            <PreviewVideoPlayer
              url={faceUrl}
              muted={muted}
              onMuteChange={setMuted}
              isFaceVideo={true}
              objectFit="cover"
              syncToTime={screenShareTime} // Secondary player - syncs to primary
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Info panel */}
        <div className="p-4 border-t border-neutral-800">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-300">
                <p className="font-semibold mb-1">Testing Mode</p>
                <p className="text-blue-400/80">Use the seek bar to test video synchronization. Facecam will automatically sync to screen share position.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
