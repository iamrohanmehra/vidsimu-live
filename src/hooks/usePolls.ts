import { useState, useEffect, useCallback } from 'react';
import {
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { pollsCollection, pollVotesCollection } from '@/lib/collections';
import type { Poll, PollOption, PollVote } from '@/types';

// Voter information for display
export interface VoterInfo {
  visitorId: string;
  name: string;
  email: string;
  selectedOptions: string[];
}

// Voters grouped by option
export type VotersByOption = Record<string, VoterInfo[]>;

interface UsePollsOptions {
  streamId: string;
  enabled?: boolean;
}

export function usePolls({ streamId, enabled = true }: UsePollsOptions) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [votersByOption, setVotersByOption] = useState<VotersByOption>({});
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to all polls for this stream
  useEffect(() => {
    if (!enabled || !streamId) return;

    const q = query(
      pollsCollection,
      where('streamId', '==', streamId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pollList: Poll[] = [];
      let active: Poll | null = null;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const poll: Poll = {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          launchedAt: data.launchedAt instanceof Timestamp ? data.launchedAt.toDate() : undefined,
          endedAt: data.endedAt instanceof Timestamp ? data.endedAt.toDate() : undefined,
        } as Poll;

        pollList.push(poll);
        if (poll.status === 'active') {
          active = poll;
        }
      });

      // Sort by createdAt desc (newest first)
      pollList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setPolls(pollList);
      setActivePoll(active);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [streamId, enabled]);

  // Subscribe to votes for active poll to get voter details
  useEffect(() => {
    if (!activePoll?.id) {
      setVotersByOption({});
      return;
    }

    const q = query(
      pollVotesCollection,
      where('pollId', '==', activePoll.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const voters: VotersByOption = {};
      
      // Initialize empty arrays for each option
      activePoll.options.forEach(opt => {
        voters[opt.id] = [];
      });

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as PollVote;
        const voterInfo: VoterInfo = {
          visitorId: data.visitorId,
          name: data.name || 'Anonymous',
          email: data.email || '',
          selectedOptions: data.selectedOptions || [],
        };

        // Add voter to each option they selected
        voterInfo.selectedOptions.forEach(optionId => {
          if (voters[optionId]) {
            voters[optionId].push(voterInfo);
          }
        });
      });

      setVotersByOption(voters);
    });

    return () => unsubscribe();
  }, [activePoll?.id, activePoll?.options]);

  // Create a new poll
  const createPoll = useCallback(async (
    question: string,
    options: string[],
    type: 'single' | 'multiple' = 'single'
  ) => {
    const pollOptions: PollOption[] = options.map((text, i) => ({
      id: `opt_${i}`,
      text,
    }));

    const voteCounts: Record<string, number> = {};
    pollOptions.forEach(opt => { voteCounts[opt.id] = 0; });

    await addDoc(pollsCollection, {
      streamId,
      question,
      options: pollOptions,
      type,
      status: 'draft',
      createdAt: serverTimestamp(),
      resultsVisible: false,
      totalVotes: 0,
      voteCounts,
    });
  }, [streamId]);

  // Launch a poll
  const launchPoll = useCallback(async (pollId: string) => {
    // End any currently active poll first
    if (activePoll?.id) {
      await updateDoc(doc(db, 'polls', activePoll.id), {
        status: 'ended',
        endedAt: serverTimestamp(),
      });
    }

    await updateDoc(doc(db, 'polls', pollId), {
      status: 'active',
      launchedAt: serverTimestamp(),
    });
  }, [activePoll]);

  // End a poll
  const endPoll = useCallback(async (pollId: string) => {
    await updateDoc(doc(db, 'polls', pollId), {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  }, []);

  // Toggle results visibility
  const toggleResultsVisibility = useCallback(async (pollId: string, visible: boolean) => {
    await updateDoc(doc(db, 'polls', pollId), {
      resultsVisible: visible,
    });
  }, []);

  // Delete a poll and all its associated votes
  const deletePoll = useCallback(async (pollId: string) => {
    // First, delete all votes for this poll
    const votesQuery = query(pollVotesCollection, where('pollId', '==', pollId));
    const votesSnapshot = await getDocs(votesQuery);
    
    const deletePromises = votesSnapshot.docs.map(voteDoc => 
      deleteDoc(doc(db, 'poll_votes', voteDoc.id))
    );
    await Promise.all(deletePromises);
    
    // Then delete the poll itself
    await deleteDoc(doc(db, 'polls', pollId));
  }, []);

  return {
    polls,
    activePoll,
    votersByOption,
    isLoading,
    createPoll,
    launchPoll,
    endPoll,
    toggleResultsVisibility,
    deletePoll,
  };
}

// Hook for viewers to interact with active poll
interface UseActivePollOptions {
  streamId: string;
  visitorId: string;
  userName?: string;
  userEmail?: string;
  enabled?: boolean;
}

export function useActivePoll({ streamId, visitorId, userName, userEmail, enabled = true }: UseActivePollOptions) {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to active poll
  useEffect(() => {
    if (!enabled || !streamId) return;

    const q = query(
      pollsCollection,
      where('streamId', '==', streamId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setActivePoll(null);
        setHasVoted(false);
        setUserVote([]);
      } else {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        setActivePoll({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
        } as Poll);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [streamId, enabled]);

  // Check if user has already voted
  useEffect(() => {
    if (!activePoll?.id || !visitorId) {
      setHasVoted(false);
      setUserVote([]);
      return;
    }

    const q = query(
      pollVotesCollection,
      where('pollId', '==', activePoll.id),
      where('visitorId', '==', visitorId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const alreadyVoted = !snapshot.empty;
      setHasVoted(alreadyVoted);
      
      if (alreadyVoted) {
        const voteData = snapshot.docs[0].data();
        setUserVote(voteData.selectedOptions || []);
      } else {
        setUserVote([]);
      }
    });

    return () => unsubscribe();
  }, [activePoll?.id, visitorId]);

  // Submit vote
  const submitVote = useCallback(async (selectedOptions: string[]) => {
    if (!activePoll?.id || hasVoted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Add vote document with user info for voter display
      await addDoc(pollVotesCollection, {
        pollId: activePoll.id,
        visitorId,
        name: userName || 'Anonymous',
        email: userEmail || '',
        selectedOptions,
        votedAt: serverTimestamp(),
      });

      // Update vote counts on poll
      const updates: Record<string, unknown> = {
        totalVotes: increment(1),
      };
      selectedOptions.forEach(optId => {
        updates[`voteCounts.${optId}`] = increment(1);
      });

      await updateDoc(doc(db, 'polls', activePoll.id), updates);
      setHasVoted(true);
      setUserVote(selectedOptions);
    } finally {
      setIsSubmitting(false);
    }
  }, [activePoll?.id, visitorId, hasVoted, isSubmitting]);

  return {
    activePoll,
    hasVoted,
    userVote,
    isLoading,
    isSubmitting,
    submitVote,
  };
}
