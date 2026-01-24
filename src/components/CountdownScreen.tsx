import React, { useState, useEffect, useMemo } from 'react';
import type { Event } from '@/types';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';

interface CountdownScreenProps {
  event: Event;
  targetTime: number; // Unix timestamp in ms
  onCountdownComplete: () => void;
}

export function CountdownScreen({ event, targetTime, onCountdownComplete }: CountdownScreenProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Enable synchronized background music during countdown (only after user interaction)
  // Music starts 10 minutes before session and syncs across all participants
  useBackgroundMusic({
    enabled: timeLeft.total > 0 && audioEnabled,
    sessionStartTime: targetTime, // Used to calculate which track should play
    onEnded: () => {
      // Music stops when countdown completes
    }
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

  const formattedDate = useMemo(() => {
    const date = new Date(targetTime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [targetTime]);

  const formattedTime = useMemo(() => {
    const date = new Date(targetTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [targetTime]);

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-950 via-neutral-900 to-violet-950 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Upcoming badge */}
        <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
          <span className="text-violet-400 text-sm font-medium">Upcoming Session</span>
        </div>

        {/* Event title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {event.title}
        </h1>

        {/* Event topic */}
        {event.topic && (
          <p className="text-xl text-neutral-400 mb-8">
            {event.topic}
          </p>
        )}

        {/* Audio hint - shows until user clicks */}
        {!audioEnabled && (
          <div className="mb-6 flex items-center justify-center gap-2 text-violet-300/80 text-sm animate-pulse">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <span>Click anywhere to enable audio</span>
          </div>
        )}

        {/* Date and time */}
        <div className="flex flex-col items-center gap-1 mb-12">
          <p className="text-lg text-white">{formattedDate}</p>
          <p className="text-2xl font-semibold text-violet-400">{formattedTime}</p>
        </div>

        {/* Countdown */}
        <div className="grid grid-flow-col gap-5 text-center auto-cols-max justify-center mb-12">
          <div className="flex flex-col p-2 bg-neutral-800/50 backdrop-blur rounded-box text-neutral-content items-center min-w-20">
            <span className="countdown font-mono text-5xl">
              <span style={{"--value":timeLeft.hours} as React.CSSProperties}></span>
            </span>
            hours
          </div>
          <div className="flex flex-col p-2 bg-neutral-800/50 backdrop-blur rounded-box text-neutral-content items-center min-w-20">
            <span className="countdown font-mono text-5xl">
              <span style={{"--value":timeLeft.minutes} as React.CSSProperties}></span>
            </span>
            min
          </div>
          <div className="flex flex-col p-2 bg-neutral-800/50 backdrop-blur rounded-box text-neutral-content items-center min-w-20">
            <span className="countdown font-mono text-5xl">
              <span style={{"--value":timeLeft.seconds} as React.CSSProperties}></span>
            </span>
            sec
          </div>
        </div>

        {/* Helper text */}
        <p className="text-neutral-500 text-sm">
          This page will automatically refresh when the session starts
        </p>
      </div>
    </div>
  );
}

interface TimeLeft {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetTime: number): TimeLeft {
  const now = Date.now();
  const total = Math.max(0, targetTime - now);

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor(total / 1000 / 60 / 60); // Total hours including days
  const days = 0; // Unused but kept for type signature compatibility if needed, though better to remove from type too.

  return { total, days, hours, minutes, seconds };
}
