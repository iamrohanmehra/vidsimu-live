import { useState } from 'react';
import { useActivePoll } from '@/hooks/usePolls';
import { CheckCircle2 } from 'lucide-react';

interface PollVoteCardProps {
  streamId: string;
  visitorId: string;
  userName?: string;
  userEmail?: string;
}

export function PollVoteCard({ streamId, visitorId, userName, userEmail }: PollVoteCardProps) {
  const { activePoll, hasVoted, userVote, isSubmitting, submitVote } = useActivePoll({ 
    streamId, 
    visitorId,
    userName,
    userEmail,
  });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  if (!activePoll) return null;

  const handleSelect = async (optionId: string) => {
    if (hasVoted || isSubmitting) return;
    
    // Optimistic UI update
    setSelectedOptions([optionId]);

    // For single choice, submit immediately
    if (activePoll.type === 'single') {
      await submitVote([optionId]);
    } else {
      // Multiple choice is currently treated as single for immediate feedback
      await submitVote([optionId]);
    }
  };

  const getPercentage = (optionId: string) => {
    if (activePoll.totalVotes === 0) return 0;
    return Math.round((activePoll.voteCounts[optionId] || 0) / activePoll.totalVotes * 100);
  };





  if (hasVoted && !activePoll.resultsVisible) return null;

  const showResults = hasVoted;

  return (
    <div className="bg-neutral-900/40 backdrop-blur-sm border-b border-neutral-800/60 p-5 animate-in fade-in duration-500">


      <h4 className="text-neutral-100 text-sm font-medium leading-relaxed mb-6 font-sans">
        {activePoll.question}
      </h4>

      <div className="space-y-3">
        {activePoll.options.map((opt) => {
          const isSelected = (hasVoted && userVote.length > 0 ? userVote : selectedOptions).includes(opt.id);
          const pct = getPercentage(opt.id);
          
          return (
            <div key={opt.id} className="relative group">
              <button
                onClick={() => !showResults && handleSelect(opt.id)}
                disabled={hasVoted || showResults || isSubmitting}
                className={`
                  w-full text-left relative p-3.5 rounded-xl border transition-all duration-300
                  flex items-center justify-between group overflow-hidden
                  ${showResults 
                    ? 'border-neutral-800/40 bg-neutral-900/20 cursor-default' 
                    : isSelected
                      ? 'bg-primary/5 border-primary/40 shadow-[0_0_20px_rgba(var(--primary),0.05)]' 
                      : 'bg-neutral-800/30 border-neutral-700/50 hover:bg-neutral-800/50 hover:border-neutral-600/80'
                  }
                  ${!showResults && isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}
                `}
              >
                {/* Results Backdrop Overlays inside the button */}
                {showResults && (
                  <div 
                    className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out z-0 
                      ${isSelected ? 'bg-primary/20' : 'bg-neutral-800/40'}`}
                    style={{ width: `${pct}%` }}
                  />
                )}

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Voting Circle / Checkmark */}
                    <div className={`
                      shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300
                      ${isSelected 
                        ? 'border-primary bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' 
                        : showResults
                          ? 'border-neutral-700 bg-neutral-800/50'
                          : 'border-neutral-600 group-hover:border-neutral-500'
                      }
                    `}>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      )}
                    </div>
                    <span className={`text-[13px] truncate font-medium ${isSelected ? 'text-white' : (showResults ? 'text-neutral-200' : 'text-neutral-300')}`}>
                      {opt.text}
                    </span>
                  </div>
                  
                  {showResults && (
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {isSelected && <CheckCircle2 className="w-3 h-3 text-primary animate-in zoom-in duration-300" />}
                      <span className="text-[11px] font-mono font-bold text-neutral-400 tabular-nums">{pct}%</span>
                    </div>
                  )}
                </div>

                {/* Loading State Spinner */}
                {isSubmitting && isSelected && !showResults && (
                  <div className="absolute inset-0 flex items-center justify-end pr-4 bg-primary/5 z-20">
                     <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

