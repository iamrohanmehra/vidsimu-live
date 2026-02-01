import { useState, useEffect } from 'react';
import { query, where, onSnapshot } from 'firebase/firestore';
import { pollVotesCollection } from '@/lib/collections';
import type { PollVote } from '@/types';
import type { VotersByOption, VoterInfo } from './usePolls';

export function usePollVotes(pollId: string | undefined, options: { id: string }[] | undefined) {
  const [votersByOption, setVotersByOption] = useState<VotersByOption>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!pollId || !options) {
      setVotersByOption({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      pollVotesCollection,
      where('pollId', '==', pollId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const voters: VotersByOption = {};
      
      // Initialize empty arrays for each option
      options.forEach(opt => {
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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [pollId, options]);

  return { votersByOption, isLoading };
}
