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
    onJoin();
  }, [onJoin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-8 text-center">
          <div className="space-y-4">
            {/* Live indicator (Centered) */}
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
              </span>
              <span className="text-destructive font-medium text-xs uppercase tracking-widest">Live Now</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                {event.title}
              </h1>
              {event.topic && (
                <p className="text-neutral-400 text-[15px] leading-relaxed">
                  {event.topic}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleJoin}
              size="lg"
              className="w-full h-12 bg-neutral-400 hover:bg-neutral-300 text-black font-semibold transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Join Session
            </Button>
            <p className="text-sm text-neutral-500">
              Click to join and enable audio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
