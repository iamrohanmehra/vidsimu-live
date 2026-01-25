import { useState } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Input } from '@/components/ui/input';
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

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <Input
            type="text"
            placeholder="Search viewers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredViewers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {searchQuery ? 'No matches found' : 'Waiting for viewers...'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredViewers.map((viewer, idx) => (
              <div key={viewer.id || idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group cursor-default">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <UserAvatar
                    src={viewer.avatar}
                    name={viewer.name}
                    email={viewer.email}
                    className="w-8 h-8"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background"></div>
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate font-medium">{viewer.name || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground truncate">{viewer.email}</div>
                </div>

                {/* Actions */}
                <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
