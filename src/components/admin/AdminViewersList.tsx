import { useState } from 'react';
import type { Viewer } from '@/types';

interface AdminViewersListProps {
  viewers: Viewer[];
  viewerCount: number;
}

export function AdminViewersList({ viewers, viewerCount }: AdminViewersListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredViewers = viewers.filter(
    (v) =>
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 bg-neutral-900/50 flex justify-between items-center">
        <h2 className="font-semibold text-neutral-200">Audience</h2>
        <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
          {viewerCount} Online
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-neutral-800">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            type="text"
            placeholder="Search viewers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredViewers.length === 0 ? (
          <div className="text-center py-8 text-neutral-600 text-sm">
            {searchQuery ? 'No matches found' : 'Waiting for viewers...'}
          </div>
        ) : (
          filteredViewers.map((viewer, idx) => (
            <div key={viewer.id || idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800/50 transition-colors group cursor-default">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-300">
                  {viewer.avatar ? <img src={viewer.avatar} className="w-full h-full rounded-full object-cover" /> : getInitials(viewer.name || viewer.email)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-neutral-900"></div>
              </div>
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-200 truncate font-medium">{viewer.name || 'Anonymous'}</div>
                <div className="text-xs text-neutral-500 truncate">{viewer.email}</div>
              </div>

              {/* Actions (Future) */}
              <button className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-white transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
              </button>
            </div>
          ))
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
