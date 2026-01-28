import { useState, useCallback } from 'react';
import { query, where, getDocs, Timestamp } from 'firebase/firestore';
import { messagesCollection, pollsCollection, pollVotesCollection } from '@/lib/collections';
import { downloadJSON, generateExportFilename } from '@/lib/export';
import type { 
  Event, 
  Message, 
  Poll, 
  PollVote, 
  Viewer,
  SessionExport,
  MessageExport,
  ParticipantExport,
  PollExport 
} from '@/types';

interface UseSessionExportOptions {
  streamId: string;
  event: Event | null;
  viewers: Viewer[];
}

export function useSessionExport({ streamId, event, viewers }: UseSessionExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportSession = useCallback(async (exportName: string) => {
    if (!event || !streamId) {
      setError('No session data available');
      return false;
    }

    setIsExporting(true);
    setError(null);

    try {
      // Fetch all messages for this stream
      const messagesQuery = query(
        messagesCollection,
        where('streamId', '==', streamId)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages: Message[] = [];
      messagesSnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as Message);
      });

      // Fetch all polls for this stream
      const pollsQuery = query(
        pollsCollection,
        where('streamId', '==', streamId)
      );
      const pollsSnapshot = await getDocs(pollsQuery);
      const polls: Poll[] = [];
      const pollIds: string[] = [];
      pollsSnapshot.forEach((doc) => {
        const data = doc.data();
        pollIds.push(doc.id);
        polls.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          launchedAt: data.launchedAt instanceof Timestamp ? data.launchedAt.toDate() : undefined,
          endedAt: data.endedAt instanceof Timestamp ? data.endedAt.toDate() : undefined,
        } as Poll);
      });

      // Fetch all votes for these polls
      const pollVotes: Record<string, PollVote[]> = {};
      for (const pollId of pollIds) {
        const votesQuery = query(
          pollVotesCollection,
          where('pollId', '==', pollId)
        );
        const votesSnapshot = await getDocs(votesQuery);
        pollVotes[pollId] = [];
        votesSnapshot.forEach((doc) => {
          const data = doc.data();
          pollVotes[pollId].push({
            id: doc.id,
            ...data,
            votedAt: data.votedAt instanceof Timestamp ? data.votedAt.toDate() : new Date(),
          } as PollVote);
        });
      }

      // Build participant list from messages and viewers
      const participantMap = new Map<string, ParticipantExport>();
      
      // Add viewers
      viewers.forEach((viewer) => {
        if (!participantMap.has(viewer.email)) {
          participantMap.set(viewer.email, {
            name: viewer.name,
            email: viewer.email,
            joinedAt: new Date(viewer.joined).toISOString(),
            messageCount: 0,
          });
        }
      });

      // Count messages per participant
      messages.forEach((msg) => {
        if (msg.messageType === 'public' && !msg.isAdminMessage) {
          const existing = participantMap.get(msg.email);
          if (existing) {
            existing.messageCount++;
          } else {
            participantMap.set(msg.email, {
              name: msg.name,
              email: msg.email,
              joinedAt: msg.timestamp.toISOString(),
              messageCount: 1,
            });
          }
        }
      });

      // Format messages for export
      const messagesExport: MessageExport[] = messages
        .filter((m) => m.messageType !== 'private')
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((msg) => ({
          id: msg.id || '',
          senderName: msg.name,
          senderEmail: msg.email,
          text: msg.message,
          timestamp: msg.timestamp.toISOString(),
          isAdminMessage: msg.isAdminMessage || false,
          messageType: msg.messageType,
          replyToMessageId: msg.targetUserId,
          replyToUserName: msg.targetUserName,
        }));

      // Format polls for export
      const pollsExport: PollExport[] = polls.map((poll) => ({
        id: poll.id || '',
        question: poll.question,
        options: poll.options,
        type: poll.type,
        status: poll.status,
        createdAt: poll.createdAt.toISOString(),
        launchedAt: poll.launchedAt?.toISOString(),
        endedAt: poll.endedAt?.toISOString(),
        totalVotes: poll.totalVotes,
        voteCounts: poll.voteCounts,
        votes: (pollVotes[poll.id || ''] || []).map((v) => ({
          visitorId: v.visitorId,
          email: v.email,
          selectedOptions: v.selectedOptions,
          votedAt: v.votedAt.toISOString(),
        })),
      }));

      // Build final export
      const sessionExport: SessionExport = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        exportName,
        session: {
          id: streamId,
          title: event.title,
          topic: event.topic,
          scheduledTime: event.time,
          duration: event.duration,
          instructor: event.instructor,
        },
        stats: {
          totalMessages: messagesExport.length,
          uniqueParticipants: participantMap.size,
          pollCount: polls.length,
          peakViewers: viewers.length, // Current snapshot, not historical peak
        },
        participants: Array.from(participantMap.values())
          .sort((a, b) => b.messageCount - a.messageCount),
        messages: messagesExport,
        polls: pollsExport,
      };

      // Trigger download
      const filename = generateExportFilename(exportName);
      downloadJSON(sessionExport, filename);

      console.log(`[Export] Successfully exported session: ${filename}`);
      return true;
    } catch (err) {
      console.error('[Export] Failed to export session:', err);
      setError(err instanceof Error ? err.message : 'Failed to export');
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [streamId, event, viewers]);

  return {
    exportSession,
    isExporting,
    error,
  };
}
