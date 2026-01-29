import { useState, useEffect, useCallback } from 'react';
import {
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { bannedUsersCollection } from '@/lib/collections';
import type { BannedUser } from '@/types';

interface UseBannedUsersOptions {
  sessionId: string;
  enabled?: boolean;
}

export function useBannedUsers({ sessionId, enabled = true }: UseBannedUsersOptions) {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for banned users in this session
  useEffect(() => {
    if (!enabled || !sessionId) {
      setIsLoading(false);
      return;
    }

    const q = query(bannedUsersCollection, where('sessionId', '==', sessionId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: BannedUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          sessionId: data.sessionId,
          email: data.email,
          name: data.name,
          bannedAt: data.bannedAt instanceof Timestamp ? data.bannedAt.toDate() : new Date(),
          bannedBy: data.bannedBy,
          reason: data.reason,
        });
      });
      setBannedUsers(items);
      setIsLoading(false);
    }, (error) => {
      console.error('[BannedUsers] Error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId, enabled]);

  // Ban a user
  const banUser = useCallback(async (email: string, name: string, reason?: string) => {
    if (!sessionId || !email.trim()) return;
    
    // Check if already banned
    const alreadyBanned = bannedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (alreadyBanned) {
      console.log('[BannedUsers] User already banned:', email);
      return;
    }
    
    try {
      await addDoc(bannedUsersCollection, {
        sessionId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        bannedAt: serverTimestamp(),
        bannedBy: 'admin',
        reason: reason?.trim() || undefined,
      });
      console.log('[BannedUsers] User banned:', email);
    } catch (error) {
      console.error('[BannedUsers] Error banning user:', error);
    }
  }, [sessionId, bannedUsers]);

  // Unban a user
  const unbanUser = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      await deleteDoc(doc(bannedUsersCollection, id));
      console.log('[BannedUsers] User unbanned:', id);
    } catch (error) {
      console.error('[BannedUsers] Error unbanning user:', error);
    }
  }, []);

  // Check if a user is banned
  const isUserBanned = useCallback((email: string) => {
    if (!email) return false;
    return bannedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
  }, [bannedUsers]);

  return {
    bannedUsers,
    isLoading,
    banUser,
    unbanUser,
    isUserBanned,
  };
}
