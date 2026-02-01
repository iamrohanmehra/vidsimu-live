import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { List } from 'react-window';
import type { VoterInfo } from '@/hooks/usePolls';
import { Search, User } from 'lucide-react';

interface PollVotersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  optionLabel: string;
  voters: VoterInfo[];
}

export function PollVotersDialog({ isOpen, onClose, optionLabel, voters }: PollVotersDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVoters = useMemo(() => {
    if (!searchQuery.trim()) return voters;
    const query = searchQuery.toLowerCase();
    return voters.filter(
      (voter) =>
        voter.name.toLowerCase().includes(query) ||
        (voter.email && voter.email.toLowerCase().includes(query))
    );
  }, [voters, searchQuery]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const voter = filteredVoters[index];
    if (!voter) return null;
    return (
      <div style={style} className="flex items-center gap-3 px-2 py-2 border-b border-border/50 hover:bg-muted/20">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
          <User className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{voter.name}</p>
          {voter.email && (
            <p className="text-xs text-muted-foreground truncate">{voter.email}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="flex justify-between items-center pr-8">
            <span className="truncate">Voters: <span className="text-primary">{optionLabel}</span></span>
            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
              {voters.length} total
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4 flex-1 flex flex-col min-h-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="voter-search"
              placeholder="Search voters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex-1 border border-border rounded-md min-h-[300px]">
            {filteredVoters.length > 0 ? (
              <List
                rowCount={filteredVoters.length}
                rowHeight={60}
                className="scrollbar-thin h-[300px] w-full"
                rowComponent={Row}
                rowProps={{} as any}
              />
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                <Search className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No voters found</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
