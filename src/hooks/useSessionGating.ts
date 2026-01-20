import { useEffect, useRef, useState, useCallback } from 'react';
import { set, onDisconnect, serverTimestamp, onValue, remove } from 'firebase/database';
import { sessionRef, sessionPointerRef, encodeEmail } from '@/lib/collections';
import { v4 as uuidv4 } from 'uuid';
import type { User, SessionData, SessionPointer } from '@/types';

interface UseSessionGatingOptions {
  eventId: string;
  user: User | null;
  enabled?: boolean;
}

interface UseSessionGatingReturn {
  isActiveSession: boolean;
  sessionId: string;
}

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function useSessionGating({ eventId, user, enabled = true }: UseSessionGatingOptions): UseSessionGatingReturn {
  const sessionIdRef = useRef<string>(uuidv4());
  const [isActiveSession, setIsActiveSession] = useState(true);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateSession = useCallback(() => {
    if (!user || !eventId) return;

    const sessionId = sessionIdRef.current;
    const sessionRefPath = sessionRef(eventId, sessionId);

    const sessionData: SessionData = {
      email: user.email,
      name: user.name,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      userAgent: navigator.userAgent,
    };

    set(sessionRefPath, {
      ...sessionData,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
  }, [eventId, user]);

  useEffect(() => {
    if (!enabled || !user || !eventId) return;

    const sessionId = sessionIdRef.current;
    const encodedEmailKey = encodeEmail(user.email);
    const sessionRefPath = sessionRef(eventId, sessionId);
    const pointerRefPath = sessionPointerRef(eventId, encodedEmailKey);

    // Create session
    const sessionData: SessionData = {
      email: user.email,
      name: user.name,
      createdAt: Date.now(),
      lastSeen: Date.now(),
      userAgent: navigator.userAgent,
    };

    set(sessionRefPath, {
      ...sessionData,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });

    // Point email to this session
    const pointerData: SessionPointer = {
      sessionId,
      updatedAt: Date.now(),
    };

    set(pointerRefPath, {
      ...pointerData,
      updatedAt: serverTimestamp(),
    });

    // Auto-remove on disconnect
    onDisconnect(sessionRefPath).remove();

    // Listen for changes to the pointer
    const unsubscribe = onValue(pointerRefPath, (snapshot) => {
      const data = snapshot.val() as SessionPointer | null;
      const isActive = data?.sessionId === sessionId;
      setIsActiveSession(isActive);
    });

    // Heartbeat to keep session alive
    heartbeatRef.current = setInterval(() => {
      updateSession();
    }, HEARTBEAT_INTERVAL);

    // Cleanup
    return () => {
      unsubscribe();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      remove(sessionRefPath);
    };
  }, [eventId, user, enabled, updateSession]);

  return {
    isActiveSession,
    sessionId: sessionIdRef.current,
  };
}
