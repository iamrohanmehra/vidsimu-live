import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  addDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { terminatedSessionsCollection } from '@/lib/collections';
import type { TerminatedSession } from '@/types';

interface UseSessionTerminationProps {
  sessionId: string;
  enabled?: boolean;
}

export function useSessionTermination({ sessionId, enabled = true }: UseSessionTerminationProps) {
  const [terminationData, setTerminationData] = useState<TerminatedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTerminating, setIsTerminating] = useState(false);

  // Listen for termination status
  useEffect(() => {
    if (!sessionId || !enabled) {
      setIsLoading(false);
      return;
    }

    const q = query(
      terminatedSessionsCollection,
      where('sessionId', '==', sessionId),
      limit(1)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        setTerminationData({
          id: doc.id,
          sessionId: data.sessionId,
          message: data.message,
          terminatedAt: data.terminatedAt instanceof Timestamp ? data.terminatedAt.toDate() : new Date(),
          terminatedBy: data.terminatedBy,
        });
      } else {
        setTerminationData(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('[SessionTermination] Error listening for termination:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, enabled]);

  // Terminate session with custom message
  const terminateSession = useCallback(async (message: string) => {
    if (!sessionId || !message.trim()) return false;
    
    setIsTerminating(true);
    try {
      await addDoc(terminatedSessionsCollection, {
        sessionId,
        message: message.trim(),
        terminatedAt: serverTimestamp(),
        terminatedBy: 'admin', // Could be enhanced to include admin email
      });
      console.log('[SessionTermination] Session terminated:', sessionId);
      return true;
    } catch (error) {
      console.error('[SessionTermination] Error terminating session:', error);
      return false;
    } finally {
      setIsTerminating(false);
    }
  }, [sessionId]);

  return {
    isTerminated: !!terminationData,
    terminationData,
    terminateSession,
    isLoading,
    isTerminating,
  };
}
