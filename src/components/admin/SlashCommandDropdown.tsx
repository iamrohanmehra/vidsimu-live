import { useRef, useEffect } from 'react';
import { Zap, Megaphone } from 'lucide-react';
import type { QuickReplyTemplate, BroadcastTemplate } from '@/types';

interface SlashCommandDropdownProps {
  quickReplies: QuickReplyTemplate[];
  broadcastTemplates: BroadcastTemplate[];
  filterText: string; // Text after the slash (e.g., "wel" for "/wel")
  visible: boolean;
  onSelect: (text: string, type: 'quick' | 'broadcast') => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

interface FilteredTemplate {
  id: string;
  text: string;
  keyword: string;
  type: 'quick' | 'broadcast';
}

export function SlashCommandDropdown({
  quickReplies,
  broadcastTemplates,
  filterText,
  visible,
  onSelect,
  // onClose, // Reserved for future use
  selectedIndex,
  onSelectedIndexChange,
}: SlashCommandDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Filter templates based on keyword
  const filteredTemplates: FilteredTemplate[] = [
    ...quickReplies
      .filter(t => t.keyword && t.keyword.toLowerCase().startsWith(filterText.toLowerCase()))
      .map(t => ({ id: t.id!, text: t.text, keyword: t.keyword, type: 'quick' as const })),
    ...broadcastTemplates
      .filter(t => t.keyword && t.keyword.toLowerCase().startsWith(filterText.toLowerCase()))
      .map(t => ({ id: t.id!, text: t.text, keyword: t.keyword, type: 'broadcast' as const })),
  ];

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedItem = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Reset selection when filter changes
  useEffect(() => {
    onSelectedIndexChange(0);
  }, [filterText, onSelectedIndexChange]);

  if (!visible || filteredTemplates.length === 0) {
    return null;
  }

  return (
    <div 
      ref={listRef}
      className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2 duration-150"
    >
      <div className="px-3 py-2 border-b border-neutral-700/50">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
          Quick Commands {filterText && <span className="text-neutral-400">/ {filterText}</span>}
        </p>
      </div>
      
      {filteredTemplates.map((template, index) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.text, template.type)}
          onMouseEnter={() => onSelectedIndexChange(index)}
          className={`w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors ${
            index === selectedIndex 
              ? 'bg-neutral-700/70' 
              : 'hover:bg-neutral-700/50'
          }`}
        >
          <div className={`mt-0.5 shrink-0 p-1 rounded ${
            template.type === 'quick' 
              ? 'bg-violet-500/20 text-violet-400' 
              : 'bg-amber-500/20 text-amber-400'
          }`}>
            {template.type === 'quick' ? (
              <Zap className="w-3 h-3" />
            ) : (
              <Megaphone className="w-3 h-3" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-300">
                /{template.keyword}
              </span>
              <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                template.type === 'quick'
                  ? 'bg-violet-500/10 text-violet-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                {template.type === 'quick' ? 'Reply' : 'Broadcast'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 truncate mt-0.5">{template.text}</p>
          </div>
        </button>
      ))}
      
      <div className="px-3 py-1.5 border-t border-neutral-700/50 bg-neutral-900/50">
        <p className="text-[9px] text-neutral-600">
          <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-500 mr-1">↑↓</kbd>
          Navigate
          <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-500 mx-1">Enter</kbd>
          Select
          <kbd className="px-1 py-0.5 bg-neutral-800 rounded text-neutral-500 mx-1">Esc</kbd>
          Close
        </p>
      </div>
    </div>
  );
}
