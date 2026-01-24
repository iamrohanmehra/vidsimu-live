import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

interface StreamHeaderProps {
  title: string;
  topic?: string;
  viewerCount: number;
  streamStartTime: number;
  muted: boolean;
  onMuteToggle: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export function StreamHeader({ 
  title, 
  topic,
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
    <header className="flex items-center justify-between px-4 py-3 bg-black border-b border-neutral-800">
      {/* Title - Left side */}
      <h1 className="text-neutral-200 font-regular truncate max-w-xl text-lg flex items-center gap-2">
        <span className="truncate">{title}</span>
        {topic && (
          <span className="hidden md:inline text-neutral-600">
            <span className="mx-2">|</span>
            <span className="text-violet-400 truncate">{topic}</span>
          </span>
        )}
      </h1>

      <div className="flex items-center gap-3">
         {/* Duration */}
        <div className="hidden md:flex items-center gap-1.5 text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded-md">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-mono">{formattedDuration}</span>
        </div>

        {/* Viewer count */}
        <div className="flex items-center gap-1.5 text-neutral-400 bg-neutral-800/50 px-2 py-1 rounded-md">
          <Users className="w-4 h-4" />
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

        {/* Chat toggle button removed for mobile/smaller screens as requested */}

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
