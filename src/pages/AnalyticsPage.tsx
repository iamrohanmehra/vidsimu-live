import { useState, useCallback, useRef, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { parseExportFile } from '@/lib/export';
import type { SessionExport, ParticipantExport, PollExport } from '@/types';
import { Button } from '@/components/ui/button';

export function AnalyticsPage() {
  const [sessionData, setSessionData] = useState<SessionExport | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'polls' | 'users'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }
    
    const data = await parseExportFile(file);
    if (data) {
      setSessionData(data);
    } else {
      setError('Invalid export file format');
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearSession = useCallback(() => {
    setSessionData(null);
    setError(null);
    setSearchQuery('');
    setActiveTab('overview');
  }, []);

  // Computed insights
  const mostActiveUser = sessionData?.participants.length 
    ? sessionData.participants.reduce((max, p) => p.messageCount > max.messageCount ? p : max, sessionData.participants[0])
    : null;

  const filteredMessages = sessionData?.messages.filter(m => 
    m.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredParticipants = sessionData?.participants.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              {sessionData ? sessionData.session.title : 'Session Analytics'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sessionData 
                ? `Exported ${new Date(sessionData.exportedAt).toLocaleDateString('en-US', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}`
                : 'Import a session export to view insights'
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sessionData && (
              <Button variant="outline" size="sm" onClick={clearSession}>
                Clear & Import New
              </Button>
            )}
            <Link to="/">
              <Button variant="outline" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        {!sessionData ? (
          /* Import Zone */
          <div className="max-w-xl mx-auto mt-12">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground hover:bg-muted/30'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileInput}
                className="hidden"
              />
              <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium mb-1">Drop JSON file here</p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                {error}
              </div>
            )}
          </div>
        ) : (
          /* Insights Display */
          <div className="max-w-5xl mx-auto">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-muted/50 p-1 rounded-lg w-fit">
              {(['overview', 'chat', 'polls', 'users'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Messages" value={sessionData.stats.totalMessages} />
                <StatCard label="Participants" value={sessionData.stats.uniqueParticipants} />
                <StatCard label="Polls" value={sessionData.stats.pollCount} />
                <StatCard label="Duration" value={sessionData.session.duration ? `${sessionData.session.duration}m` : 'N/A'} />
                
                {mostActiveUser && (
                  <div className="col-span-2 md:col-span-4 p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Most Active Participant</p>
                    <p className="text-lg font-medium">{mostActiveUser.name}</p>
                    <p className="text-sm text-muted-foreground">{mostActiveUser.messageCount} messages</p>
                  </div>
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {filteredMessages.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No messages found</p>
                  ) : (
                    filteredMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`p-3 rounded-lg border ${
                          msg.isAdminMessage 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{msg.senderName}</span>
                          {msg.isAdminMessage && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">Admin</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Polls Tab */}
            {activeTab === 'polls' && (
              <div className="space-y-6">
                {sessionData.polls.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No polls in this session</p>
                ) : (
                  sessionData.polls.map((poll) => (
                    <PollCard key={poll.id} poll={poll} />
                  ))
                )}
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
                <div className="grid gap-2">
                  {filteredParticipants.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No participants found</p>
                  ) : (
                    filteredParticipants.map((p, i) => (
                      <ParticipantRow key={i} participant={p} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function PollCard({ poll }: { poll: PollExport }) {
  const [showVoters, setShowVoters] = useState<string | null>(null);
  const maxVotes = Math.max(...Object.values(poll.voteCounts), 1);

  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border">
      <h3 className="font-medium mb-3">{poll.question}</h3>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const count = poll.voteCounts[opt.id] || 0;
          const percentage = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
          const width = maxVotes > 0 ? (count / maxVotes) * 100 : 0;
          
          return (
            <div key={opt.id}>
              <div 
                className="relative p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                onClick={() => setShowVoters(showVoters === opt.id ? null : opt.id)}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-primary/20 rounded-lg transition-all"
                  style={{ width: `${width}%` }}
                />
                <div className="relative flex justify-between items-center">
                  <span className="text-sm">{opt.text}</span>
                  <span className="text-sm font-medium">{count} ({percentage}%)</span>
                </div>
              </div>
              
              {showVoters === opt.id && (
                <div className="mt-1 ml-4 text-xs text-muted-foreground">
                  {poll.votes
                    .filter(v => v.selectedOptions.includes(opt.id))
                    .map((v, i) => (
                      <span key={i} className="inline-block mr-2">
                        {v.email || v.visitorId.slice(0, 8)}
                      </span>
                    ))
                  }
                  {poll.votes.filter(v => v.selectedOptions.includes(opt.id)).length === 0 && (
                    <span>No votes</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-3">{poll.totalVotes} total votes</p>
    </div>
  );
}

function ParticipantRow({ participant }: { participant: ParticipantExport }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
      <div>
        <p className="font-medium text-sm">{participant.name}</p>
        <p className="text-xs text-muted-foreground">{participant.email}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium tabular-nums">{participant.messageCount}</p>
        <p className="text-xs text-muted-foreground">messages</p>
      </div>
    </div>
  );
}
