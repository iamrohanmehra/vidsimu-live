import { useState } from 'react';
import { usePolls } from '@/hooks/usePolls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Poll } from '@/types';

interface AdminPollManagerProps {
  streamId: string;
}

export function AdminPollManager({ streamId }: AdminPollManagerProps) {
  const { polls, activePoll, createPoll, launchPoll, endPoll, toggleResultsVisibility } = usePolls({ streamId });
  
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const handleCreatePoll = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    
    await createPoll(question.trim(), validOptions, pollType);
    setQuestion('');
    setOptions(['', '']);
    setIsCreating(false);
  };

  const getVotePercentage = (poll: Poll, optionId: string) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((poll.voteCounts[optionId] || 0) / poll.totalVotes * 100);
  };

  const draftPolls = polls.filter(p => p.status === 'draft');
  const endedPolls = polls.filter(p => p.status === 'ended').slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center">
        <span className="text-sm font-medium text-foreground">Manage Polls</span>
        {!isCreating && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            + New
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Poll Form */}
        {isCreating && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <Input
              type="text"
              placeholder="Poll question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx] = e.target.value;
                      setOptions(newOpts);
                    }}
                  />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(idx)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={handleAddOption} className="text-xs text-primary hover:underline">+ Add option</button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="radio" name="type" checked={pollType === 'single'} onChange={() => setPollType('single')} className="accent-primary" />
                Single
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <input type="radio" name="type" checked={pollType === 'multiple'} onChange={() => setPollType('multiple')} className="accent-primary" />
                Multiple
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreatePoll} className="flex-1" size="sm">
                Create
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Active Poll */}
        {activePoll && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Live</span>
              <span className="ml-auto text-xs text-muted-foreground">{activePoll.totalVotes} votes</span>
            </div>
            <p className="text-foreground font-medium text-sm mb-3">{activePoll.question}</p>
            
            {/* Results */}
            <div className="space-y-2 mb-4">
              {activePoll.options.map((opt) => {
                const pct = getVotePercentage(activePoll, opt.id);
                return (
                  <div key={opt.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{opt.text}</span>
                      <span className="text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => endPoll(activePoll.id!)}
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                End
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleResultsVisibility(activePoll.id!, !activePoll.resultsVisible)}
                className="flex-1"
              >
                {activePoll.resultsVisible ? 'Hide' : 'Show'} Results
              </Button>
            </div>
          </div>
        )}

        {/* Draft Polls */}
        {draftPolls.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">Drafts</h3>
            <div className="space-y-2">
              {draftPolls.map((poll) => (
                <div key={poll.id} className="rounded-lg border border-border bg-card p-3 flex justify-between items-center">
                  <p className="text-sm text-foreground truncate flex-1">{poll.question}</p>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => launchPoll(poll.id!)}
                    className="ml-2"
                  >
                    Launch
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Ended Polls */}
        {endedPolls.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">Recent</h3>
            <div className="space-y-2">
              {endedPolls.map((poll) => (
                <div key={poll.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm text-muted-foreground truncate">{poll.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">{poll.totalVotes} votes • Ended</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {polls.length === 0 && !isCreating && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No polls yet</p>
            <p className="text-xs mt-1">Create one to engage your audience</p>
          </div>
        )}
      </div>
    </div>
  );
}
