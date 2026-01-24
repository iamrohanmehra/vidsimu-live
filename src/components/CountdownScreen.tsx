import React, { useState, useEffect } from 'react';
import type { Event } from '@/types';
import { useBackgroundMusic } from '@/hooks/useBackgroundMusic';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';

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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
      <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
        {/* Event title */}
        <h1 className="text-[28px] font-semibold text-neutral-200 mb-2 leading-tight">
          {event.title}
        </h1>

        {/* Event topic */}
        {event.topic && (
          <p className="text-xl text-neutral-400 mb-8">
            LIVE session <span className="text-violet-400">"{event.topic}"</span> begins in
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

        {/* Countdown */}
        <div className="grid grid-flow-col gap-2 text-center auto-cols-max justify-center mb-8 text-white items-center">
          <div className="flex flex-col">
            <div className="flex items-center justify-center gap-1">
              {timeLeft.hours.toString().padStart(2, '0').split('').map((digit, i) => (
                <span key={i} className="countdown font-bold text-[72px]">
                  <span style={{"--value": parseInt(digit)} as React.CSSProperties}>
                    {digit}
                  </span>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col justify-center pb-2">
            <span className="font-bold text-[72px] text-neutral-600">:</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-center gap-1">
              {timeLeft.minutes.toString().padStart(2, '0').split('').map((digit, i) => (
                <span key={i} className="countdown font-bold text-[72px]">
                  <span style={{"--value": parseInt(digit)} as React.CSSProperties}>
                    {digit}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center pb-2">
            <span className="font-bold text-[72px] text-neutral-600">:</span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-center gap-1">
              {timeLeft.seconds.toString().padStart(2, '0').split('').map((digit, i) => (
                <span key={i} className="countdown font-bold text-[72px]">
                  <span style={{"--value": parseInt(digit)} as React.CSSProperties}>
                    {digit}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Users waiting capsule */}
        <div className="inline-flex items-center gap-2 bg-neutral-800/50 backdrop-blur border border-neutral-700/50 rounded-full px-4 py-1.5 mb-8 text-neutral-400">
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
  const hours = Math.floor(total / (1000 * 60 * 60)); // Total hours

  return { total, hours, minutes, seconds };
}
