import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              {/* Live indicator */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                </span>
                <span className="text-destructive font-medium text-sm uppercase tracking-wider">Live Now</span>
              </div>
              <CardTitle className="text-2xl">{event.title}</CardTitle>
              {event.topic && (
                <CardDescription className="text-base">
                  {event.topic}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleJoin}
                size="lg"
                className="w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Join Session
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Click to join and enable audio
          </p>
        </div>
      </div>
    </div>
  );
}
