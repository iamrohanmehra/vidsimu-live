import { useState, useEffect, useMemo } from 'react';
import type { Event } from '@/types';

interface CountdownScreenProps {
  event: Event;
  targetTime: number; // Unix timestamp in ms
  onCountdownComplete: () => void;
}

export function CountdownScreen({ event, targetTime, onCountdownComplete }: CountdownScreenProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetTime));

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-violet-950 flex items-center justify-center p-4">
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

        {/* Date and time */}
        <div className="flex flex-col items-center gap-1 mb-12">
          <p className="text-lg text-white">{formattedDate}</p>
          <p className="text-2xl font-semibold text-violet-400">{formattedTime}</p>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-4 gap-3 md:gap-4 max-w-lg mx-auto mb-12">
          <CountdownUnit value={timeLeft.days} label="Days" />
          <CountdownUnit value={timeLeft.hours} label="Hours" />
          <CountdownUnit value={timeLeft.minutes} label="Minutes" />
          <CountdownUnit value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Helper text */}
        <p className="text-neutral-500 text-sm">
          This page will automatically refresh when the session starts
        </p>
      </div>
    </div>
  );
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="bg-neutral-800/50 backdrop-blur border border-neutral-700 rounded-xl p-4">
      <div className="text-3xl md:text-4xl font-bold text-white tabular-nums">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs md:text-sm text-neutral-500 uppercase tracking-wide mt-1">
        {label}
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
  const hours = Math.floor((total / 1000 / 60 / 60) % 24);
  const days = Math.floor(total / 1000 / 60 / 60 / 24);

  return { total, days, hours, minutes, seconds };
}
