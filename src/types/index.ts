// Stream Event from Codekaro API
export interface Event {
  id: string;
  title: string;
  time: string; // ISO 8601 timestamp
  topic?: string;
  url: string; // HLS stream URL for face cam
  screenUrl: string; // HLS stream URL for screen share
  description?: string;
  duration?: number; // Duration in minutes
  connectingDelay?: number; // Delay in seconds before stream starts (default 30)
  instructor?: string; // Instructor name
  instructorImage?: string; // Instructor avatar URL
}

// User from Codekaro API
export interface User {
  name: string;
  email: string;
  avatar: string;
}

// Chat Message
export interface Message {
  id?: string;
  streamId: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  message: string;
  timestamp: Date;
  messageType: 'public' | 'private' | 'broadcast';
  targetUserId?: string;
  targetUserEmail?: string;
  targetUserName?: string;
  isAdminMessage?: boolean;
  isPinned?: boolean;
  pinnedAt?: Date;
  pinnedBy?: string;
}

// Presence data in RTDB
export interface PresenceData {
  name: string;
  email: string;
  avatar: string;
  joined: number; // Server timestamp
}

// Session data for device gating
export interface SessionData {
  email: string;
  name: string;
  createdAt: number;
  lastSeen: number;
  userAgent: string;
}

// Session pointer for current active session per email
export interface SessionPointer {
  sessionId: string;
  updatedAt: number;
}

// Stream states
export type StreamState = 'loading' | 'countdown' | 'connecting' | 'live' | 'ended' | 'error';

// Stored user in localStorage
export interface StoredUser {
  name: string;
  email: string;
  avatar: string;
}

// Viewer for analytics
export interface Viewer {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joined: number;
}

// Poll Option
export interface PollOption {
  id: string;
  text: string;
}

// Live Poll
export interface Poll {
  id?: string;
  streamId: string;
  question: string;
  options: PollOption[];
  type: 'single' | 'multiple';
  status: 'draft' | 'active' | 'ended';
  createdAt: Date;
  launchedAt?: Date;
  endedAt?: Date;
  resultsVisible: boolean;
  totalVotes: number;
  voteCounts: Record<string, number>; // optionId -> count
}

// Poll Vote
export interface PollVote {
  id?: string;
  pollId: string;
  visitorId: string;
  email?: string;
  selectedOptions: string[];
  votedAt: Date;
}
