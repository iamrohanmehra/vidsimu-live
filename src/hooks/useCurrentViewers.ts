import { useEffect, useState } from 'react';
import { onValue } from 'firebase/database';
import { streamPresenceRef } from '@/lib/collections';
import type { PresenceData, Viewer } from '@/types';

interface UseCurrentViewersOptions {
  streamId: string;
  enabled?: boolean;
}

interface UseCurrentViewersReturn {
  viewerCount: number;
  viewers: Viewer[];
}

export function useCurrentViewers({ streamId, enabled = true }: UseCurrentViewersOptions): UseCurrentViewersReturn {
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    if (!enabled || !streamId) return;

    const streamRefPath = streamPresenceRef(streamId);

    const unsubscribe = onValue(streamRefPath, (snapshot) => {
      const data = snapshot.val() as Record<string, PresenceData> | null;
      
      if (data) {
        const viewerList: Viewer[] = Object.entries(data).map(([id, presence]) => ({
          id,
          name: presence.name,
          email: presence.email,
          avatar: presence.avatar,
          joined: presence.joined,
        }));
        
        setViewers(viewerList);
        setViewerCount(viewerList.length);
      } else {
        setViewers([]);
        setViewerCount(0);
      }
    });

    return () => unsubscribe();
  }, [streamId, enabled]);

  return {
    viewerCount,
    viewers,
  };
}
