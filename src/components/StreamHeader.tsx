import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface StreamHeaderProps {
  title: string;
  viewerCount: number;
  streamStartTime: number;
  muted: boolean;
  onMuteToggle: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export function StreamHeader({ 
  title, 
  viewerCount, 
  streamStartTime,
  muted,
  onMuteToggle,
  onToggleChat,
  isChatOpen = true,
}: StreamHeaderProps) {
  const [elapsed, setElapsed] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!streamStartTime) return;

    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - streamStartTime) / 1000));
      setElapsed(diff);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [streamStartTime]);

  const formattedDuration = useMemo(() => {
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsed]);

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-800">
      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="text-red-500 font-semibold text-sm uppercase">Live</span>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-neutral-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-mono">{formattedDuration}</span>
        </div>
      </div>

      {/* Title - hidden on mobile */}
      <h1 className="hidden md:block text-white font-semibold truncate max-w-md">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        {/* Viewer count */}
        <div className="flex items-center gap-1.5 text-neutral-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm font-medium">{viewerCount.toLocaleString()}</span>
        </div>

        {/* Mute/Unmute toggle */}
        <button
          onClick={onMuteToggle}
          className={`p-2 rounded-lg transition-colors ${
            muted 
              ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
              : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
          }`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            // Muted icon (speaker with X)
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            // Unmuted icon (speaker with waves)
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Chat toggle (mobile) */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            className={`md:hidden p-2 rounded-lg transition-colors ${
              isChatOpen ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
        )}

        {/* Help link */}
        <Link
          to="/help"
          className="p-2 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          title="Help"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
