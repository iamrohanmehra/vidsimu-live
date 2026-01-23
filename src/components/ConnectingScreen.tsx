import { useEffect, useRef } from 'react';
import type { Event } from '@/types';

interface ConnectingScreenProps {
  event: Event;
  effectiveStreamStart: number; // Unix timestamp in ms when stream actually starts
  onConnectingComplete: () => void;
}

export function ConnectingScreen({ event, effectiveStreamStart, onConnectingComplete }: ConnectingScreenProps) {
  const hasTransitionedRef = useRef(false);

  // Get instructor name - default to "Ashish Shukla"
  const instructorName = event.instructor || 'Ashish Shukla';
  const instructorImage = event.instructorImage || 'https://codekaro.in/assets/img/ashish.jpeg';

  // Auto-transition to live when effectiveStreamStart is reached
  useEffect(() => {
    const checkTime = () => {
      const now = Date.now();
      if (now >= effectiveStreamStart && !hasTransitionedRef.current) {
        hasTransitionedRef.current = true;
        console.log('[Connecting] Time reached, transitioning to live...');
        onConnectingComplete();
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 100);

    return () => clearInterval(interval);
  }, [effectiveStreamStart, onConnectingComplete]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-neutral-100">
      {/* Pulsing Avatar Container */}
      <div className="w-40 h-40 mb-8">
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Pulse Animation Rings - Multiple for larger effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-violet-400 opacity-20 rounded-full animate-pulse-ring" />
          </div>
          <div className="absolute inset-2 flex items-center justify-center">
            <div className="w-full h-full bg-violet-500 opacity-15 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
          </div>
          {/* Instructor Avatar */}
          <img
            src={instructorImage}
            alt={instructorName}
            className="h-28 w-28 rounded-full object-cover relative z-10 border-4 border-white shadow-lg"
          />
        </div>
      </div>

      {/* Connecting Text */}
      <p className="text-neutral-600 text-lg">
        Connecting to{' '}
        <span className="font-bold text-neutral-900">{instructorName}'s</span> class
      </p>
    </div>
  );
}
