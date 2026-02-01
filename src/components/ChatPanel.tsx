import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  MessageSquare,
  Sparkles, 
  Megaphone,
  SendHorizontal,
  Pin
} from 'lucide-react';
import { BroadcastMessage } from '@/components/BroadcastMessage';
import type { Message } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  isOpen?: boolean;
}

export function ChatPanel({ 
  messages, 
  onSendMessage, 
  isSending, 
  isOpen = true,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Separate pinned (broadcasts) and regular messages
  const pinnedMessages = useMemo(() => messages.filter(m => m.isPinned), [messages]);
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    
    await onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  const getAvatarColor = (name: string) => {
    const themes = [
      { bg: 'bg-zinc-800', text: 'text-blue-300', border: 'border-blue-500/20', ring: 'ring-blue-500/40', color: 'rgba(96,165,250,0.7)' },
      { bg: 'bg-zinc-800', text: 'text-emerald-300', border: 'border-emerald-500/20', ring: 'ring-emerald-500/40', color: 'rgba(52,211,153,0.7)' },
      { bg: 'bg-zinc-800', text: 'text-violet-300', border: 'border-violet-500/20', ring: 'ring-violet-500/40', color: 'rgba(167,139,250,0.7)' },
      { bg: 'bg-zinc-800', text: 'text-rose-300', border: 'border-rose-500/20', ring: 'ring-rose-500/40', color: 'rgba(251,113,133,0.7)' },
      { bg: 'bg-zinc-800', text: 'text-amber-300', border: 'border-amber-500/20', ring: 'ring-amber-500/40', color: 'rgba(251,191,36,0.7)' },
      { bg: 'bg-zinc-800', text: 'text-cyan-300', border: 'border-cyan-500/20', ring: 'ring-cyan-500/40', color: 'rgba(34,211,238,0.7)' },
      { bg: 'bg-zinc-800', text: 'text-indigo-300', border: 'border-indigo-500/20', ring: 'ring-indigo-500/40', color: 'rgba(129,140,248,0.7)' },
    ];
    const charCodeSum = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return themes[charCodeSum % themes.length];
  };

  const isJoinMessage = (message: string) => {
    return message.toLowerCase().endsWith(' joined') || 
           message.toLowerCase().startsWith('joined ') ||
           message.toLowerCase().includes(' has joined');
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-white">


      {/* Pinned Section / Broadcast Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <Megaphone className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-2">Announcement</p>
              {pinnedMessages.map(msg => (
                <div key={msg.id} className="space-y-2">
                  <BroadcastMessage 
                    text={msg.message} 
                    link={msg.broadcastLink}
                    showQrCode={msg.showQrCode}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 bg-neutral-900/30 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20">
            <MessageSquare className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isAdmin = msg.isAdminMessage;
            const isBroadcast = msg.messageType === 'broadcast' || msg.isPinned;
            
            // Check for join messages
            if (isJoinMessage(msg.message)) {
              return (
                <div key={msg.id || idx} className="py-1 px-4 text-center">
                  <span className="text-[10px] text-neutral-500 font-medium bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 inline mr-0.5" />
                    <span className="text-neutral-300 font-normal">{msg.name}</span> joined
                  </span>
                </div>
              );
            }

            const theme = !isAdmin && !isBroadcast ? getAvatarColor(isAdmin ? 'Team Codekaro' : msg.name) : null;
            const displayName = isAdmin ? 'Team Codekaro' : msg.name;

            return (
              <div 
                key={msg.id || idx} 
                className="group relative flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 py-1 -mx-2 rounded-xl transition-colors"
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0 border ring-1 transition-all duration-300 shadow-lg relative overflow-hidden ${
                  isAdmin ? 'bg-zinc-800 text-white border-white/10 ring-white/20' :
                  isBroadcast ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-500/30' :
                  `${theme?.bg} ${theme?.text} ${theme?.border} ${theme?.ring}`
                }`}>
                  {isBroadcast ? (
                    <span style={{ filter: 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.5))' }}>📢</span>
                  ) : (
                    <span 
                      style={{ 
                        filter: theme?.color 
                          ? `drop-shadow(0 0 8px ${theme.color})` 
                          : isAdmin 
                            ? `drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))` 
                            : 'none' 
                      }}
                      className="drop-shadow-sm font-black"
                    >
                      {getInitials(displayName)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className={`font-normal text-[11px] ${isAdmin ? 'text-primary' : isBroadcast ? 'text-amber-400' : 'text-neutral-200'}`}>
                      {displayName}
                      {isAdmin && (
                        <span className="ml-1.5 opacity-60 font-bold uppercase tracking-tighter text-[9px]">Admin</span>
                      )}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      {msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  {/* Broadcast with link/QR support */}
                  {isBroadcast && (msg.broadcastLink || msg.showQrCode) ? (
                    <div className="mt-1">
                      <BroadcastMessage 
                        text={msg.message} 
                        link={msg.broadcastLink}
                        showQrCode={msg.showQrCode}
                      />
                    </div>
                  ) : (
                    <div className={`text-[14px] mt-0.5 leading-relaxed transition-colors ${
                      isBroadcast ? 'text-amber-200/90 group-hover:text-amber-100' : 
                      msg.messageType === 'private' ? 'text-purple-200/90 group-hover:text-purple-100' : 
                      'text-neutral-400 group-hover:text-neutral-300'
                    }`}>
                      {renderMessageWithLinks(msg.message, !!isAdmin || !!isBroadcast)}
                    </div>
                  )}

                  {/* Private Reply Indicator */}
                  {msg.messageType === 'private' && (
                    <div className="mt-1 text-[9px] text-purple-400/80 font-medium flex items-center gap-1.5">
                      <Pin className="w-2.5 h-2.5 rotate-45" />
                      Private Message
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 bg-neutral-900 border-t border-neutral-800 shrink-0">
        <div className="relative group mt-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            name="chat-input"
            placeholder="Tap here to send your message"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2.5 px-4 pr-10 text-xs text-neutral-100 placeholder-neutral-500 focus:bg-neutral-800/50 focus:border-neutral-600 transition-all outline-none"
            disabled={isSending}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            <button 
              onClick={handleSend}
              disabled={isSending || !inputText.trim()}
              className={`transition-colors ${inputText.trim() ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-700 cursor-not-allowed'}`}
            >
              <SendHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderMessageWithLinks(text: string, isClickable: boolean) {
  if (!isClickable) return text;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all relative z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

