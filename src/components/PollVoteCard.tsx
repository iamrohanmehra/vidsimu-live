import { useState, useEffect } from 'react';
import { useActivePoll } from '@/hooks/usePolls';

interface PollVoteCardProps {
  streamId: string;
  visitorId: string;
}

export function PollVoteCard({ streamId, visitorId }: PollVoteCardProps) {
  const { activePoll, hasVoted, userVote, isSubmitting, submitVote } = useActivePoll({ streamId, visitorId });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Sync server-side vote record to local state (for persisted results on refresh)
  useEffect(() => {
    if (userVote && userVote.length > 0) {
      setSelectedOptions(userVote);
    }
  }, [userVote]);

  if (!activePoll) return null;

  const handleSelect = async (optionId: string) => {
    if (hasVoted || isSubmitting) return;
    
    // Optimistic UI update
    setSelectedOptions([optionId]);

    // For single choice, submit immediately (Zoom style behavior request)
    if (activePoll.type === 'single') {
      await submitVote([optionId]);
    } else {
      // For multiple choice without a submit button, usage is ambiguous. 
      // We'll mimic single-choice behavior if user requested removing button, 
      // or we'd need a different UX. Assuming single-choice focus for this request.
       await submitVote([optionId]);
    }
  };

  const getPercentage = (optionId: string) => {
    if (activePoll.totalVotes === 0) return 0;
    return Math.round((activePoll.voteCounts[optionId] || 0) / activePoll.totalVotes * 100);
  };

  const showResults = hasVoted || activePoll.resultsVisible;

  return (
    <div className="bg-black px-4 py-3 md:p-2 border-b border-neutral-800">
      <h4 className="text-neutral-200 text-sm mt-3 mb-6 leading-snug font-regular">
        {activePoll.question}
      </h4>

      <div className="space-y-2 mb-2">
        {activePoll.options.map((opt) => {
          const isSelected = selectedOptions.includes(opt.id);
          const pct = getPercentage(opt.id);
          
          return (
            <button
              key={opt.id}
              onClick={() => !showResults && handleSelect(opt.id)}
              disabled={showResults || isSubmitting}
              className={`
                w-full text-left relative p-3 rounded-lg border transition-all duration-200 
                overflow-hidden group flex items-center justify-between
                ${showResults 
                  ? 'border-neutral-800 cursor-default' 
                  : isSelected
                    ? 'bg-neutral-800 border-neutral-600 text-white shadow-sm' 
                    : 'bg-neutral-900/20 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                }
                ${!showResults && isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Progress Bar Background (only when showing results) */}
              {showResults && (
                <div 
                  className={`absolute inset-y-0 left-0 bg-neutral-800 transition-all duration-700 ease-out ${isSelected ? 'opacity-100' : 'opacity-60'}`}
                  style={{ width: `${pct}%` }}
                />
              )}

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between w-full">
                <span className={`text-sm ${showResults && isSelected ? 'text-white' : showResults ? 'text-neutral-300' : ''}`}>
                  {opt.text}
                </span>
                
                <div className="flex items-center">
                  {showResults && (
                      <span className="text-sm font-mono text-neutral-400 mr-3">{pct}%</span>
                  )}

                  {/* Radio Button / Status Indicator */}
                  <div className={`
                    w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all
                    ${isSelected 
                      ? 'border-white bg-white' 
                      : showResults
                          ? 'border-neutral-700 bg-transparent'
                          : 'border-neutral-600 group-hover:border-neutral-500 bg-transparent'
                    }
                  `}>
                    {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                  </div>
                </div>
              </div>

              {/* Submit Spinner Overlay */}
              {isSubmitting && isSelected && !showResults && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] z-20">
                   <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      

    </div>
  );
}
