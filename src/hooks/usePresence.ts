import { useEffect, useRef, useCallback } from 'react';
import { set, onDisconnect, serverTimestamp, onValue, remove } from 'firebase/database';
import { presenceRef, streamPresenceRef } from '@/lib/collections';
import { v4 as uuidv4 } from 'uuid';
import type { User, PresenceData } from '@/types';

interface UsePresenceOptions {
  streamId: string;
  user: User | null;
  enabled?: boolean;
}

interface UsePresenceReturn {
  clientId: string;
  viewerCount: number;
}

export function usePresence({ streamId, user, enabled = true }: UsePresenceOptions): UsePresenceReturn {
  const clientIdRef = useRef<string>(uuidv4());
  const viewerCountRef = useRef<number>(0);
  const countCallbackRef = useRef<(count: number) => void>(() => {});

  // Force re-render when count changes
  const forceUpdate = useCallback(() => {
    countCallbackRef.current(viewerCountRef.current);
  }, []);

  useEffect(() => {
    if (!enabled || !user || !streamId) return;

    const clientId = clientIdRef.current;
    const presenceRefPath = presenceRef(streamId, clientId);
    const streamRefPath = streamPresenceRef(streamId);

    // Register presence
    const presenceData: PresenceData = {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      joined: Date.now(),
    };

    // Set presence and configure onDisconnect
    set(presenceRefPath, {
      ...presenceData,
      joined: serverTimestamp(),
    });

    // Auto-remove on disconnect
    onDisconnect(presenceRefPath).remove();

    // Listen for presence changes to update viewer count
    const unsubscribe = onValue(streamRefPath, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      viewerCountRef.current = count;
      forceUpdate();
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      remove(presenceRefPath);
    };
  }, [streamId, user, enabled, forceUpdate]);

  return {
    clientId: clientIdRef.current,
    viewerCount: viewerCountRef.current,
  };
}
