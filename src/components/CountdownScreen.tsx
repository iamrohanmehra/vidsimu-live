import { useState, useEffect, useRef } from 'react';
import type { Event } from '@/types';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import { ModeToggle } from '@/components/mode-toggle';
import { cn } from '@/lib/utils';

interface CountdownScreenProps {
  event: Event;
  targetTime: number; // Unix timestamp in ms
  onCountdownComplete: () => void;
  isEmbedded?: boolean;
}

export function CountdownScreen({ event, targetTime, onCountdownComplete, isEmbedded = false }: CountdownScreenProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { viewerCount } = useCurrentViewers({ streamId: event.id });
  const lastSecondsRef = useRef(timeLeft.seconds);

  // Enable synchronized background music during countdown (only after user interaction)
  useBackgroundMusic({
    enabled: timeLeft.total > 0 && audioEnabled && !isEmbedded,
    sessionStartTime: targetTime,
    onEnded: () => {}
  });

  // Enable audio on first click anywhere on the screen (only if not embedded)
  useEffect(() => {
    if (isEmbedded) return;

    const enableAudio = () => {
      if (!audioEnabled) {
        console.log('[Countdown] User clicked - enabling audio');
        setAudioEnabled(true);
      }
    };

    document.addEventListener('click', enableAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', enableAudio);
    };
  }, [audioEnabled, isEmbedded]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(targetTime);
      
      // Only update state if the seconds value has changed to prevent unnecessary re-renders
      // and ensure smooth flipping. Or if total hits 0.
      if (remaining.seconds !== lastSecondsRef.current || remaining.total <= 0) {
        lastSecondsRef.current = remaining.seconds;
        setTimeLeft(remaining);
      }

      if (remaining.total <= 0) {
        clearInterval(interval);
        onCountdownComplete();
      }
    }, 100); // Check every 100ms for precision

    return () => clearInterval(interval);
  }, [targetTime, onCountdownComplete]);

  return (
    <div className={cn(
      "flex items-center justify-center p-4 relative transition-colors duration-300",
      isEmbedded ? "h-full w-full bg-transparent" : "min-h-screen bg-background"
    )}>
      {!isEmbedded && (
        <div className="absolute top-4 right-4 z-50">
          <ModeToggle />
        </div>
      )}
      
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        {/* Event title */}
        <h1 className={cn(
          "font-semibold mb-2 leading-tight",
          isEmbedded ? "text-xl text-white" : "text-[28px] text-foreground"
        )}>
          {event.title}
        </h1>

        {/* Event topic */}
        {event.topic && (
          <p className={cn(
            "mb-8",
            isEmbedded ? "text-base text-white/80" : "text-xl text-muted-foreground"
          )}>
            LIVE session <span className={isEmbedded ? "text-white" : "text-foreground"}>"{event.topic}"</span> begins in
          </p>
        )}

        {/* Audio hint - shows until user clicks */}
        {!audioEnabled && !isEmbedded && (
          <div className="mb-6 flex items-center justify-center gap-2 text-neutral-400 text-sm animate-pulse">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Click anywhere to enable audio</span>
          </div>
        )}

        {/* DaisyUI Countdown */}
        <div className={cn(
          "flex items-center justify-center mb-8",
          isEmbedded ? "gap-2 text-white" : "gap-4 text-foreground"
        )}>
          <div className="flex flex-col items-center">
            <span className={cn(
              "countdown font-mono tabular-nums",
              isEmbedded ? "text-4xl" : "text-7xl"
            )}>
              <span style={{"--value": Math.floor(timeLeft.hours / 10)} as React.CSSProperties}></span>
              <span style={{"--value": timeLeft.hours % 10} as React.CSSProperties}></span>
            </span>
            <span className={cn(
              "text-xs mt-2 uppercase tracking-wider",
              isEmbedded ? "text-white/60" : "text-neutral-500"
            )}>hours</span>
          </div>
          
          <span className={cn(
            "font-light pb-6",
            isEmbedded ? "text-2xl text-white/40" : "text-5xl text-muted-foreground/50"
          )}>:</span>

          <div className="flex flex-col items-center">
            <span className={cn(
              "countdown font-mono tabular-nums",
              isEmbedded ? "text-4xl" : "text-7xl"
            )}>
              <span style={{"--value": Math.floor(timeLeft.minutes / 10)} as React.CSSProperties}></span>
              <span style={{"--value": timeLeft.minutes % 10} as React.CSSProperties}></span>
            </span>
            <span className={cn(
              "text-xs mt-2 uppercase tracking-wider",
              isEmbedded ? "text-white/60" : "text-neutral-500"
            )}>min</span>
          </div>

          <span className={cn(
            "font-light pb-6",
            isEmbedded ? "text-2xl text-white/40" : "text-5xl text-muted-foreground/50"
          )}>:</span>

          <div className="flex flex-col items-center">
            <span className={cn(
              "countdown font-mono tabular-nums",
              isEmbedded ? "text-4xl" : "text-7xl"
            )}>
              <span style={{"--value": Math.floor(timeLeft.seconds / 10)} as React.CSSProperties}></span>
              <span style={{"--value": timeLeft.seconds % 10} as React.CSSProperties}></span>
            </span>
            <span className={cn(
              "text-xs mt-2 uppercase tracking-wider",
              isEmbedded ? "text-white/60" : "text-neutral-500"
            )}>sec</span>
          </div>
        </div>

        {/* Users waiting capsule */}
        {!isEmbedded && (
          <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur border border-border/50 rounded-full px-4 py-1.5 mb-8 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[12px] font-medium">
              {viewerCount} users waiting
            </span>
          </div>
        )}
      </div>

      {/* Helper text moved to bottom */}
      {!isEmbedded && (
        <p className="text-neutral-500 text-sm absolute bottom-8 left-0 w-full text-center">
          This page will automatically refresh when the session starts
        </p>
      )}
    </div>
  );
}

interface TimeLeft {
  total: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetTime: number): TimeLeft {
  const now = Date.now();
  const total = Math.max(0, targetTime - now);

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor(total / (1000 * 60 * 60));

  return { total, hours, minutes, seconds };
}
