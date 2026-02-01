import { useState } from 'react';
import { usePolls } from '@/hooks/usePolls';
import { usePollTemplates } from '@/hooks/usePollTemplates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Poll, PollTemplate } from '@/types';
import { Trash2, BookTemplate, Pencil, Play, BarChart2 } from 'lucide-react';
import { PollResults } from './polls/PollResults';

interface AdminPollManagerProps {
  streamId: string;
}

export function AdminPollManager({ streamId }: AdminPollManagerProps) {
  const { polls, activePoll, createPoll, launchPoll, endPoll, toggleResultsVisibility, deletePoll } = usePolls({ streamId });
  const { templates, createTemplate, updateTemplate, deleteTemplate } = usePollTemplates();
  
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [pollType, setPollType] = useState<'single' | 'multiple'>('single');
  const [deletingPollId, setDeletingPollId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Template state
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PollTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<string | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  // Viewing Poll State
  const [viewingPoll, setViewingPoll] = useState<Poll | null>(null);

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const handleCreatePoll = async () => {
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2) {
      await createPoll(question, validOptions, pollType);
      setQuestion('');
      setOptions(['', '']);
      setIsCreating(false);
    }
  };

  // Save current poll as template
  const handleSaveAsTemplate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2 && templateName.trim()) {
      await createTemplate(templateName, question, validOptions, pollType);
      setTemplateName('');
    }
  };

  // Launch poll from template
  const handleLaunchFromTemplate = async (template: PollTemplate) => {
    await createPoll(template.question, template.options, template.type);
  };

  // Edit template
  const handleUpdateTemplate = async () => {
    if (!editingTemplate?.id) return;
    const validOptions = options.filter(o => o.trim());
    if (question.trim() && validOptions.length >= 2 && templateName.trim()) {
      await updateTemplate(editingTemplate.id, {
        name: templateName,
        question,
        options: validOptions,
        type: pollType,
      });
      setEditingTemplate(null);
      setQuestion('');
      setOptions(['', '']);
      setTemplateName('');
    }
  };

  const draftPolls = polls.filter(p => p.status === 'draft');
  const endedPolls = polls.filter(p => p.status === 'ended');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center gap-2">
        <span className="text-sm font-medium text-foreground">Manage Polls</span>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant={showTemplates ? 'secondary' : 'ghost'}
            onClick={() => setShowTemplates(!showTemplates)}
            className="h-8 w-8 p-0"
            title="Templates"
          >
            <BookTemplate className="w-4 h-4" />
          </Button>
          {!isCreating && !editingTemplate && (
            <Button size="sm" onClick={() => setIsCreating(true)}>
              + New
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Poll Form */}
        {isCreating && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <Input
              name="poll-question"
              type="text"
              placeholder="Poll question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    name={`poll-option-${idx}`}
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

            {/* Save as Template option */}
            <div className="border-t border-border pt-3 mt-2">
              <div className="flex gap-2">
                <Input
                  name="template-name"
                  type="text"
                  placeholder="Template name (optional)"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveAsTemplate}
                  disabled={!templateName.trim() || !question.trim() || options.filter(o => o.trim()).length < 2}
                  title="Save as template"
                >
                  <BookTemplate className="w-4 h-4" />
                </Button>
              </div>
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

        {/* Edit Template Form */}
        {editingTemplate && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-primary uppercase">Edit Template</span>
            </div>
            <Input
              name="edit-template-name"
              type="text"
              placeholder="Template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <Input
              name="edit-template-question"
              type="text"
              placeholder="Poll question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    name={`edit-template-option-${idx}`}
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

            <div className="flex gap-2 pt-2">
              <Button onClick={handleUpdateTemplate} className="flex-1" size="sm">
                Save Changes
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setEditingTemplate(null);
                setQuestion('');
                setOptions(['', '']);
                setTemplateName('');
              }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Templates Panel */}
        {showTemplates && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase">Poll Templates</h3>
            {templates.length === 0 ? (
              <p className="text-xs text-muted-foreground">No templates yet. Create a poll and save it as a template.</p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="rounded-lg border border-border p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{template.name}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{template.question}</p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{template.options.length} options • {template.type}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {confirmDeleteTemplateId === template.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                setDeletingTemplateId(template.id!);
                                await deleteTemplate(template.id!);
                                setDeletingTemplateId(null);
                                setConfirmDeleteTemplateId(null);
                              }}
                              disabled={deletingTemplateId === template.id}
                              className="h-7 px-2 text-xs"
                            >
                              {deletingTemplateId === template.id ? '...' : 'Delete'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteTemplateId(null)}
                              className="h-7 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleLaunchFromTemplate(template)}
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10"
                              title="Launch poll from template"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingTemplate(template);
                                setTemplateName(template.name);
                                setQuestion(template.question);
                                setOptions(template.options.length > 0 ? template.options : ['', '']);
                                setPollType(template.type);
                                setShowTemplates(false);
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              title="Edit template"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setConfirmDeleteTemplateId(template.id!)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              title="Delete template"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Poll */}
        {activePoll && (
          <PollResults 
            poll={activePoll} 
            isLive={true} 
            actions={
              <div className="flex gap-2 w-full">
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
            }
          />
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
            <h3 className="text-xs font-medium text-muted-foreground uppercase mb-2">History</h3>
            <div className="space-y-2">
              {endedPolls.map((poll) => (
                <div key={poll.id} className="rounded-lg border border-border p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">{poll.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{poll.totalVotes} votes • Ended</p>
                    </div>
                    
                    <div className="flex gap-1 shrink-0">
                      {confirmDeleteId === poll.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              setDeletingPollId(poll.id!);
                              await deletePoll(poll.id!);
                              setDeletingPollId(null);
                              setConfirmDeleteId(null);
                            }}
                            disabled={deletingPollId === poll.id}
                            className="h-7 px-2 text-xs"
                          >
                            {deletingPollId === poll.id ? '...' : 'Delete'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-7 px-2 text-xs"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setViewingPoll(poll)}
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="View results"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(poll.id!)}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
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

      <Dialog open={!!viewingPoll} onOpenChange={(open) => !open && setViewingPoll(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Poll Results</DialogTitle>
          </DialogHeader>
          {viewingPoll && (
             <PollResults poll={viewingPoll} className="border-0 p-0" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
