import { useEffect, useRef, useState } from 'react';
import type { Event } from '@/types';
import type { SyncConfidence } from '@/hooks/useOptimisticVideoSync';

interface ConnectingScreenProps {
  event: Event;
  effectiveStreamStart: number; // Unix timestamp in ms when stream actually starts
  syncConfidence?: SyncConfidence; // Sync confidence level
  onConnectingComplete: () => void;
  isOverlay?: boolean; // If true, renders as overlay instead of full screen
}

const MIN_DISPLAY_DURATION = 500; // Minimum time to show connecting screen (prevents flash)

export function ConnectingScreen({ 
  event, 
  effectiveStreamStart, 
  syncConfidence = 'low',
  onConnectingComplete,
  isOverlay = false,
}: ConnectingScreenProps) {
  const hasTransitionedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const [canTransition, setCanTransition] = useState(false);

  // Get instructor name - default to "Ashish Shukla"
  const instructorName = event.instructor || 'Ashish Shukla';
  const instructorImage = event.instructorImage || 'https://codekaro.in/assets/img/ashish.jpeg';

  // Enforce minimum display duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanTransition(true);
    }, MIN_DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Auto-transition when:
  // 1. Minimum display time has elapsed
  // 2. Sync confidence is high OR time has reached
  useEffect(() => {
    const checkTransition = () => {
      if (hasTransitionedRef.current) return;

      const now = Date.now();
      const timeReached = now >= effectiveStreamStart;
      const syncReady = syncConfidence === 'high';
      const minTimeElapsed = canTransition;

      // Transition when minimum time elapsed AND (sync ready OR time reached)
      if (minTimeElapsed && (syncReady || timeReached)) {
        hasTransitionedRef.current = true;
        const elapsed = now - mountTimeRef.current;
        
        if (import.meta.env.DEV) {
          console.log(
            `[Connecting] Transitioning to live | Elapsed: ${elapsed}ms | ` +
            `Sync: ${syncConfidence} | Time reached: ${timeReached}`
          );
        }
        
        onConnectingComplete();
      }
    };

    checkTransition();
    const interval = setInterval(checkTransition, 100);

    return () => clearInterval(interval);
  }, [effectiveStreamStart, syncConfidence, canTransition, onConnectingComplete]);

  const containerClass = isOverlay
    ? "absolute inset-0 z-50 flex flex-col items-center justify-center bg-black"
    : "w-full h-screen flex flex-col items-center justify-center bg-black";

  return (
    <div className={containerClass}>
      {/* Pulsing Avatar Container */}
      <div className="w-40 h-40 mb-8">
        <div className="relative flex items-center justify-center w-full h-full">
          {/* Pulse Animation Rings - Multiple for larger effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-neutral-700 opacity-50 rounded-full animate-pulse-ring" />
          </div>
          <div className="absolute inset-2 flex items-center justify-center">
            <div className="w-full h-full bg-neutral-600 opacity-30 rounded-full animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
          </div>
          {/* Instructor Avatar */}
          <img
            src={instructorImage}
            alt={instructorName}
            className="h-28 w-28 rounded-full object-cover relative z-10 border-4 border-neutral-800 shadow-lg"
          />
        </div>
      </div>

      {/* Connecting Text */}
      <p className="text-neutral-400 text-lg mb-3">
        Connecting to{' '}
        <span className="font-bold text-white">{instructorName}'s</span> class
      </p>

      {/* Sync Progress Indicator */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        {syncConfidence === 'low' && (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Preparing session...</span>
          </>
        )}
        {syncConfidence === 'medium' && (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Syncing video...</span>
          </>
        )}
        {syncConfidence === 'high' && (
          <>
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-600">Ready</span>
          </>
        )}
      </div>

      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <div className="mt-4 text-xs text-neutral-400 font-mono">
          Confidence: {syncConfidence} | Can transition: {canTransition ? 'yes' : 'no'}
        </div>
      )}
    </div>
  );
}
