import { useEffect, useState } from 'react';
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
  const [clientId] = useState(() => {
    // Try to get stored client ID to persist identity across refreshes
    try {
      const stored = localStorage.getItem('vidsimu_client_id');
      if (stored) return stored;
    } catch (e) {
      console.error('Error accessing localStorage:', e);
    }
    
    // Generate new ID and store it
    const newId = uuidv4();
    try {
      localStorage.setItem('vidsimu_client_id', newId);
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
    return newId;
  });
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!enabled || !user || !streamId) return;


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

      setViewerCount(count);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      remove(presenceRefPath);
    };
  }, [streamId, user, enabled, clientId]);

  return {
    clientId,
    viewerCount,
  };
}
