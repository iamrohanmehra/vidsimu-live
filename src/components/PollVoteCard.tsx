import { useState } from 'react';
import { useActivePoll } from '@/hooks/usePolls';

interface PollVoteCardProps {
  streamId: string;
  visitorId: string;
}

export function PollVoteCard({ streamId, visitorId }: PollVoteCardProps) {
  const { activePoll, hasVoted, isSubmitting, submitVote } = useActivePoll({ streamId, visitorId });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  if (!activePoll) return null;

  const handleSelect = (optionId: string) => {
    if (hasVoted) return;
    
    if (activePoll.type === 'single') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0 || hasVoted) return;
    await submitVote(selectedOptions);
    setSelectedOptions([]);
  };

  const getPercentage = (optionId: string) => {
    if (activePoll.totalVotes === 0) return 0;
    return Math.round((activePoll.voteCounts[optionId] || 0) / activePoll.totalVotes * 100);
  };

  const showResults = hasVoted || activePoll.resultsVisible;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 bg-violet-500/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-bold text-violet-400 uppercase">Live Poll</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <p className="text-white font-medium text-sm">{activePoll.question}</p>

        {/* Voting Mode */}
        {!showResults && (
          <>
            <div className="space-y-2">
              {activePoll.options.map((opt) => {
                const isSelected = selectedOptions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={hasVoted}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-sm ${
                      isSelected
                        ? 'bg-violet-500/20 border-violet-500 text-violet-200'
                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-violet-500' : 'border-neutral-600'
                      }`}>
                        {isSelected && <span className="w-2 h-2 bg-violet-500 rounded-full"></span>}
                      </span>
                      {opt.text}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0 || isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Vote'}
            </button>
          </>
        )}

        {/* Results Mode */}
        {showResults && (
          <div className="space-y-2">
            {hasVoted && !activePoll.resultsVisible && (
              <p className="text-xs text-neutral-500 text-center mb-2">Thanks for voting! Waiting for results...</p>
            )}
            
            {activePoll.resultsVisible && (
              <>
                {activePoll.options.map((opt) => {
                  const pct = getPercentage(opt.id);
                  return (
                    <div key={opt.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-neutral-300">{opt.text}</span>
                        <span className="text-neutral-500">{pct}%</span>
                      </div>
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-neutral-600 text-center pt-2">{activePoll.totalVotes} total votes</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
