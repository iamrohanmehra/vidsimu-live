import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { Event } from '@/types';

interface JoinSessionModalProps {
  isOpen: boolean;
  event: Event;
  onJoin: () => void;
}

export function JoinSessionModal({ isOpen, event, onJoin }: JoinSessionModalProps) {
  const handleJoin = useCallback(() => {
    // This click captures user gesture to allow audio autoplay
    onJoin();
  }, [onJoin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="bg-black border border-neutral-800 rounded-2xl w-full max-w-lg p-8 shadow-2xl text-center">
        {/* Live indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <span className="text-red-500 font-semibold text-sm uppercase tracking-wider">Live Now</span>
        </div>

        {/* Event title */}
        <h1 className="text-3xl font-bold text-white mb-3 leading-tight">
          {event.title}
        </h1>

        {/* Topic/description */}
        {event.topic && (
          <p className="text-neutral-400 mb-8 text-lg">
            {event.topic}
          </p>
        )}

        {/* Join button */}
        <Button
          onClick={handleJoin}
          size="lg"
          className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-lg py-6 rounded-xl shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-[1.02]"
        >
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Join Session
        </Button>

        <p className="mt-6 text-sm text-neutral-500">
          Click to join and enable audio
        </p>
      </div>
    </div>
  );
}
