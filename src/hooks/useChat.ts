import { useEffect, useState, useCallback } from 'react';
import {
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { messagesCollection } from '@/lib/collections';
import type { Message, User } from '@/types';

interface UseChatOptions {
  streamId: string;
  user: User | null;
  clientId: string;
  enabled?: boolean;
}

interface UseChatReturn {
  userMessages: Message[];
  privateMessages: Message[];
  sendMessage: (text: string) => Promise<void>;
  isSending: boolean;
}

const MAX_MESSAGE_LENGTH = 500;

export function useChat({ streamId, user, clientId, enabled = true }: UseChatOptions): UseChatReturn {
  const [userMessages, setUserMessages] = useState<Message[]>([]);
  const [privateMessages, setPrivateMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Listen for user's own public messages
  useEffect(() => {
    if (!enabled || !user || !streamId) return;

    const q = query(
      messagesCollection,
      where('streamId', '==', streamId),
      where('email', '==', user.email),
      where('messageType', '==', 'public'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as Message);
      });
      // Reverse to show oldest first
      setUserMessages(messages.reverse());
    });

    return () => unsubscribe();
  }, [streamId, user, enabled]);

  // Listen for private messages from admin
  useEffect(() => {
    if (!enabled || !user || !streamId) return;

    const q = query(
      messagesCollection,
      where('streamId', '==', streamId),
      where('messageType', '==', 'private'),
      where('targetUserEmail', '==', user.email),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe: Unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as Message);
      });
      // Reverse to show oldest first
      setPrivateMessages(messages.reverse());
    });

    return () => unsubscribe();
  }, [streamId, user, enabled]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!user || !streamId || !text.trim()) return;

      const trimmedText = text.trim().slice(0, MAX_MESSAGE_LENGTH);
      setIsSending(true);

      try {
        await addDoc(messagesCollection, {
          streamId,
          userId: clientId,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          message: trimmedText,
          timestamp: serverTimestamp(),
          messageType: 'public',
        });
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [streamId, user, clientId]
  );

  return {
    userMessages,
    privateMessages,
    sendMessage,
    isSending,
  };
}
