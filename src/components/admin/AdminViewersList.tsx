import { useState } from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Ban, UserX, Undo2, ChevronDown, ChevronRight, ShieldX } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Viewer, BannedUser } from '@/types';

interface AdminViewersListProps {
  viewers: Viewer[];
  viewerCount: number;
  bannedUsers: BannedUser[];
  onBanUser: (email: string, name: string, reason?: string) => Promise<void>;
  onUnbanUser: (id: string) => Promise<void>;
}

export function AdminViewersList({ 
  viewers, 
  viewerCount, 
  bannedUsers, 
  onBanUser, 
  onUnbanUser 
}: AdminViewersListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showBanList, setShowBanList] = useState(false);
  const [userToBan, setUserToBan] = useState<Viewer | null>(null);
  const [banReason, setBanReason] = useState('');

  const filteredViewers = viewers.filter(
    (v) =>
      v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if viewer is banned
  const isViewerBanned = (email: string) => {
    return bannedUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
  };

  const handleBanUser = async () => {
    if (!userToBan) return;
    await onBanUser(userToBan.email, userToBan.name || 'Unknown', banReason);
    setUserToBan(null);
    setBanReason('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <Input
            type="text"
            placeholder={`Search ${viewerCount} viewers...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Viewers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredViewers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {searchQuery ? 'No matches found' : 'Waiting for viewers...'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredViewers.map((viewer, idx) => {
              const isBanned = isViewerBanned(viewer.email);
              
              return (
                <div 
                  key={viewer.id || idx} 
                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group cursor-default ${isBanned ? 'opacity-50' : ''}`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={viewer.avatar}
                      name={viewer.name}
                      email={viewer.email}
                      className="w-8 h-8"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 ${isBanned ? 'bg-destructive' : 'bg-emerald-500'} rounded-full border-2 border-background`}></div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate font-medium flex items-center gap-1.5">
                      {viewer.name || 'Anonymous'}
                      {isBanned && <ShieldX className="w-3 h-3 text-destructive" />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{viewer.email}</div>
                  </div>

                  {/* Actions */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1" side="left">
                      {isBanned ? (
                        <button
                          onClick={() => {
                            const bannedEntry = bannedUsers.find(u => u.email.toLowerCase() === viewer.email.toLowerCase());
                            if (bannedEntry) onUnbanUser(bannedEntry.id!);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Unban User
                        </button>
                      ) : (
                        <button
                          onClick={() => setUserToBan(viewer)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Ban User
                        </button>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ban List Section */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowBanList(!showBanList)}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showBanList ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <UserX className="w-3 h-3" />
          <span>Banned Users</span>
          <span className="text-muted-foreground/60 ml-1">({bannedUsers.length})</span>
        </button>
        
        {showBanList && bannedUsers.length > 0 && (
          <div className="px-4 pb-4 space-y-2 max-h-32 overflow-y-auto">
            {bannedUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2 p-2 bg-destructive/5 border border-destructive/10 rounded-lg">
                <UserX className="w-3.5 h-3.5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate">{user.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnbanUser(user.id!)}
                  className="h-6 px-2 text-xs text-emerald-500 hover:text-emerald-600"
                >
                  Unban
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {showBanList && bannedUsers.length === 0 && (
          <div className="px-4 pb-4 text-xs text-muted-foreground text-center">
            No banned users in this session
          </div>
        )}
      </div>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={!!userToBan} onOpenChange={(open) => !open && setUserToBan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Ban User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban <strong>{userToBan?.name}</strong> ({userToBan?.email}) from this session? They will be immediately removed and cannot rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-2">
            <Input
              type="text"
              placeholder="Reason (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="text-sm"
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBanReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBanUser}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
