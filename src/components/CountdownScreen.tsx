import { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import { ModeToggle } from '@/components/mode-toggle';

interface CountdownScreenProps {
  event: Event;
  targetTime: number; // Unix timestamp in ms
  onCountdownComplete: () => void;
}

export function CountdownScreen({ event, targetTime, onCountdownComplete }: CountdownScreenProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { viewerCount } = useCurrentViewers({ streamId: event.id });

  // Enable synchronized background music during countdown (only after user interaction)
  useBackgroundMusic({
    enabled: timeLeft.total > 0 && audioEnabled,
    sessionStartTime: targetTime,
    onEnded: () => {}
  });

  // Enable audio on first click anywhere on the screen
  useEffect(() => {
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
  }, [audioEnabled]);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft(targetTime);
      setTimeLeft(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
        onCountdownComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onCountdownComplete]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <ModeToggle />
      </div>
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        {/* Event title */}
        <h1 className="text-[28px] font-semibold text-foreground mb-2 leading-tight">
          {event.title}
        </h1>

        {/* Event topic */}
        {event.topic && (
          <p className="text-xl text-muted-foreground mb-8">
            LIVE session <span className="text-foreground">"{event.topic}"</span> begins in
          </p>
        )}

        {/* Audio hint - shows until user clicks */}
        {!audioEnabled && (
          <div className="mb-6 flex items-center justify-center gap-2 text-neutral-400 text-sm animate-pulse">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Click anywhere to enable audio</span>
          </div>
        )}

        {/* DaisyUI Countdown */}
        <div className="flex items-center justify-center gap-4 mb-8 text-foreground">
          <div className="flex flex-col items-center">
            <span className="countdown font-mono tabular-nums text-7xl">
              <span style={{"--value": Math.floor(timeLeft.hours / 10)} as React.CSSProperties}></span>
              <span style={{"--value": timeLeft.hours % 10} as React.CSSProperties}></span>
            </span>
            <span className="text-xs text-neutral-500 mt-2 uppercase tracking-wider">hours</span>
          </div>
          
          <span className="text-5xl text-muted-foreground/50 font-light pb-6">:</span>

          <div className="flex flex-col items-center">
            <span className="countdown font-mono tabular-nums text-7xl">
              <span style={{"--value": Math.floor(timeLeft.minutes / 10)} as React.CSSProperties}></span>
              <span style={{"--value": timeLeft.minutes % 10} as React.CSSProperties}></span>
            </span>
            <span className="text-xs text-neutral-500 mt-2 uppercase tracking-wider">min</span>
          </div>

          <span className="text-5xl text-muted-foreground/50 font-light pb-6">:</span>

          <div className="flex flex-col items-center">
            <span className="countdown font-mono tabular-nums text-7xl">
              <span style={{"--value": Math.floor(timeLeft.seconds / 10)} as React.CSSProperties}></span>
              <span style={{"--value": timeLeft.seconds % 10} as React.CSSProperties}></span>
            </span>
            <span className="text-xs text-neutral-500 mt-2 uppercase tracking-wider">sec</span>
          </div>
        </div>

        {/* Users waiting capsule */}
        <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur border border-border/50 rounded-full px-4 py-1.5 mb-8 text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[12px] font-medium">
            {viewerCount} users waiting
          </span>
        </div>
      </div>

      {/* Helper text moved to bottom */}
      <p className="text-neutral-500 text-sm absolute bottom-8 left-0 w-full text-center">
        This page will automatically refresh when the session starts
      </p>
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
