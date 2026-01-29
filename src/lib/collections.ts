import { collection, type CollectionReference, type DocumentData } from 'firebase/firestore';
import { ref, type DatabaseReference } from 'firebase/database';
import { db, rtdb } from './firebase';
import type { Message, Poll, PollVote, PollTemplate, QuickReplyTemplate, BroadcastTemplate, BannedUser } from '@/types';

// Firestore Collections
export const messagesCollection = collection(db, 'messages') as CollectionReference<Message, DocumentData>;
export const pollsCollection = collection(db, 'polls') as CollectionReference<Poll, DocumentData>;
export const pollVotesCollection = collection(db, 'poll_votes') as CollectionReference<PollVote, DocumentData>;
export const pollTemplatesCollection = collection(db, 'poll_templates') as CollectionReference<PollTemplate, DocumentData>;
export const quickReplyTemplatesCollection = collection(db, 'quick_reply_templates') as CollectionReference<QuickReplyTemplate, DocumentData>;
export const broadcastTemplatesCollection = collection(db, 'broadcast_templates') as CollectionReference<BroadcastTemplate, DocumentData>;
export const bannedUsersCollection = collection(db, 'banned_users') as CollectionReference<BannedUser, DocumentData>;

// Realtime Database References
export function presenceRef(streamId: string, clientId: string): DatabaseReference {
  return ref(rtdb, `presence/${streamId}/${clientId}`);
}

export function streamPresenceRef(streamId: string): DatabaseReference {
  return ref(rtdb, `presence/${streamId}`);
}

export function sessionRef(eventId: string, sessionId: string): DatabaseReference {
  return ref(rtdb, `sessions/${eventId}/sessions/${sessionId}`);
}

export function sessionPointerRef(eventId: string, encodedEmail: string): DatabaseReference {
  return ref(rtdb, `sessions/${eventId}/currentByEmail/${encodedEmail}`);
}

// Utility to encode email for Firebase key (replace . with ,)
export function encodeEmail(email: string): string {
  return email.replace(/\./g, ',');
}
