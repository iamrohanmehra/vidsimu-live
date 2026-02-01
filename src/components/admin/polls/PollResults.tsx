import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import type { Poll } from '@/types';
import { usePollVotes } from '@/hooks/usePollVotes';
import { PollVotersDialog } from './PollVotersDialog';

interface PollResultsProps {
  poll: Poll;
  actions?: React.ReactNode;
  className?: string;
  isLive?: boolean;
}

export function PollResults({ poll, actions, className = '', isLive = false }: PollResultsProps) {
  const { votersByOption } = usePollVotes(poll.id, poll.options);
  
  // Voters Dialog state
  const [votersDialogOption, setVotersDialogOption] = useState<{ id: string; label: string }>({ id: '', label: '' });
  const [isVotersDialogOpen, setIsVotersDialogOpen] = useState(false);

  const handleOpenVoters = (optionId: string, label: string) => {
    setVotersDialogOption({ id: optionId, label });
    setIsVotersDialogOpen(true);
  };

  const getVotePercentage = (optionId: string) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((poll.voteCounts[optionId] || 0) / poll.totalVotes * 100);
  };

  return (
    <div className={`rounded-lg border p-4 ${isLive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card'} ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        {isLive && (
          <>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
          </>
        )}
        {!isLive && <span className="text-xs font-medium text-muted-foreground uppercase">Results</span>}
        <span className="ml-auto text-xs text-muted-foreground">{poll.totalVotes} votes</span>
      </div>
      
      <p className="text-foreground font-medium text-sm mb-3">{poll.question}</p>
      
      {/* Results */}
      <div className="space-y-3 mb-4">
        {poll.options.map((opt) => {
          const pct = getVotePercentage(opt.id);
          const voters = votersByOption[opt.id] || [];
          const voteCount = poll.voteCounts[opt.id] || 0;
          
          return (
            <div key={opt.id} className="space-y-1">
              {/* Option Header */}
              <div className="flex justify-between items-center text-xs mb-1">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">{opt.text}</span>
                  <span className="text-muted-foreground/60 text-[10px]">({voteCount})</span>
                </div>
                <div className="flex items-center gap-3">
                  {voters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      draggable={false}
                      className="h-5 px-1.5 text-[10px] text-primary hover:text-primary hover:bg-primary/10 flex items-center gap-1"
                      onClick={() => handleOpenVoters(opt.id, opt.text)}
                    >
                      <Users className="w-3 h-3" />
                      View Voters
                    </Button>
                  )}
                  <span className="text-muted-foreground tabular-nums">{pct}%</span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isLive ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}

      <PollVotersDialog
        isOpen={isVotersDialogOpen}
        onClose={() => setIsVotersDialogOpen(false)}
        optionLabel={votersDialogOption.label}
        voters={votersByOption[votersDialogOption.id] || []}
      />
    </div>
  );
}
