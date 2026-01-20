import { useState } from 'react';
import { usePolls } from '@/hooks/usePolls';
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
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Polls
        </h2>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
          >
            + New Poll
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Create Poll Form */}
        {isCreating && (
          <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 space-y-3">
            <input
              type="text"
              placeholder="Poll question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
            />
            
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx] = e.target.value;
                      setOptions(newOpts);
                    }}
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                  />
                  {options.length > 2 && (
                    <button onClick={() => handleRemoveOption(idx)} className="text-neutral-500 hover:text-red-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={handleAddOption} className="text-xs text-violet-400 hover:text-violet-300">+ Add option</button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                <input type="radio" name="type" checked={pollType === 'single'} onChange={() => setPollType('single')} className="accent-violet-500" />
                Single choice
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
                <input type="radio" name="type" checked={pollType === 'multiple'} onChange={() => setPollType('multiple')} className="accent-violet-500" />
                Multiple choice
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleCreatePoll} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm py-2 rounded-lg transition-colors">
                Create Poll
              </button>
              <button onClick={() => setIsCreating(false)} className="px-4 text-neutral-400 hover:text-white text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Active Poll */}
        {activePoll && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase">Live Poll</span>
              <span className="ml-auto text-xs text-neutral-400">{activePoll.totalVotes} votes</span>
            </div>
            <p className="text-white font-medium mb-3">{activePoll.question}</p>
            
            {/* Results */}
            <div className="space-y-2 mb-4">
              {activePoll.options.map((opt) => {
                const pct = getVotePercentage(activePoll, opt.id);
                return (
                  <div key={opt.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-300">{opt.text}</span>
                      <span className="text-neutral-400">{pct}%</span>
                    </div>
                    <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
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
              <button
                onClick={() => endPoll(activePoll.id!)}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm py-2 rounded-lg transition-colors border border-red-500/30"
              >
                End Poll
              </button>
              <button
                onClick={() => toggleResultsVisibility(activePoll.id!, !activePoll.resultsVisible)}
                className={`flex-1 text-sm py-2 rounded-lg transition-colors border ${
                  activePoll.resultsVisible
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                }`}
              >
                {activePoll.resultsVisible ? 'Hide Results' : 'Share Results'}
              </button>
            </div>
          </div>
        )}

        {/* Draft Polls */}
        {draftPolls.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Draft Polls</h3>
            <div className="space-y-2">
              {draftPolls.map((poll) => (
                <div key={poll.id} className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-3 flex justify-between items-center">
                  <p className="text-sm text-neutral-300 truncate flex-1">{poll.question}</p>
                  <button
                    onClick={() => launchPoll(poll.id!)}
                    className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition-colors"
                  >
                    Launch
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Ended Polls */}
        {endedPolls.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Recent Polls</h3>
            <div className="space-y-2">
              {endedPolls.map((poll) => (
                <div key={poll.id} className="bg-neutral-800/30 border border-neutral-800 rounded-lg p-3">
                  <p className="text-sm text-neutral-400 truncate">{poll.question}</p>
                  <p className="text-xs text-neutral-600 mt-1">{poll.totalVotes} votes • Ended</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {polls.length === 0 && !isCreating && (
          <div className="text-center py-8 text-neutral-600">
            <p className="text-sm">No polls yet</p>
            <p className="text-xs mt-1">Create one to engage your audience!</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
      `}</style>
    </div>
  );
}
