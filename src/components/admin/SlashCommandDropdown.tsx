import { useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
// import type { QuickReplyTemplate, BroadcastTemplate } from '@/types'; // Removing unused imports

// Generic interface that covers both QuickReplyTemplate and BroadcastTemplate
export interface SlashCommandItem {
  id?: string;
  text: string;
  keyword?: string;
  // Broadcast specific optional fields
  link?: string;
  showQrCode?: boolean;
}

interface SlashCommandDropdownProps {
  items: SlashCommandItem[];
  filterText: string; // Text after the slash (e.g., "wel" for "/wel")
  visible: boolean;
  onSelect: (item: SlashCommandItem) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
  label?: string; // e.g. "Reply" or "Broadcast"
  position?: 'top' | 'bottom'; // Control dropdown direction
}

interface FilteredTemplate {
  original: SlashCommandItem;
  id: string;
  text: string;
  keyword: string;
}

export function SlashCommandDropdown({
  items,
  filterText,
  visible,
  onSelect,
  // onClose, // Reserved for future use
  selectedIndex,
  onSelectedIndexChange,
  label = "Reply",
  position = 'top'
}: SlashCommandDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Filter templates based on keyword
  const filteredTemplates: FilteredTemplate[] = 
    items
      .filter(t => t.keyword && t.keyword.toLowerCase().startsWith(filterText.toLowerCase()))
      .map(t => ({ 
        original: t,
        id: t.id || Math.random().toString(36).substr(2, 9), 
        text: t.text, 
        keyword: t.keyword! 
      }));

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      // In bottom mode, the order is header -> items -> footer
      // In top mode, it's header -> items -> footer
      // The logic for scrollIntoView remains the same as long as the DOM structure is static
      const selectedItem = listRef.current.children[selectedIndex + 1] as HTMLElement; // +1 to account for header
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

  const positionClasses = position === 'top' 
    ? 'bottom-full mb-2 animate-in slide-in-from-bottom-2' 
    : 'top-full mt-2 animate-in slide-in-from-top-2';

  return (
    <div 
      ref={listRef}
      className={`absolute left-0 right-0 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-48 overflow-y-auto duration-150 ${positionClasses}`}
    >
      <div className="px-3 py-2 border-b border-neutral-700/50 sticky top-0 bg-neutral-800 z-10">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
          Quick Commands {filterText && <span className="text-neutral-400">/ {filterText}</span>}
        </p>
      </div>
      
      {filteredTemplates.map((template, index) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.original)}
          onMouseEnter={() => onSelectedIndexChange(index)}
          className={`w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors ${
            index === selectedIndex 
              ? 'bg-neutral-700/70' 
              : 'hover:bg-neutral-700/50'
          }`}
        >
          <div className="mt-0.5 shrink-0 p-1 rounded bg-violet-500/20 text-violet-400">
            <Zap className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-300">
                /{template.keyword}
              </span>
              <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                {label}
              </span>
            </div>
            <p className="text-xs text-neutral-500 truncate mt-0.5">{template.text || '(No text)'}</p>
          </div>
        </button>
      ))}
      
      <div className="px-3 py-1.5 border-t border-neutral-700/50 bg-neutral-900/50 sticky bottom-0">
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
