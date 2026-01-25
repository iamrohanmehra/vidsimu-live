import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';

import { UserAvatar } from '@/components/ui/UserAvatar';
import type { Message } from '@/types';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  isSending: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const MAX_MESSAGE_LENGTH = 500;

export function ChatPanel({ messages, onSendMessage, isSending, isOpen = true }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Separate pinned (broadcasts) and regular messages
  const pinnedMessages = messages.filter(m => m.isPinned);
  const regularMessages = messages.filter(m => !m.isPinned);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [regularMessages.length]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isSending) return;

    try {
      await onSendMessage(input);
      setInput('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [input, isSending, onSendMessage]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-black/50 backdrop-blur-sm">
      
      {/* Pinned Messages (Broadcasts) */}
      {pinnedMessages.length > 0 && (
        <div className="bg-black border-b border-neutral-800 px-4 py-2 md:px-3 shrink-0">
          <div className="text-[10px] font-semibold text-neutral-400 mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            Broadcast
          </div>
          <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
            {pinnedMessages.map(msg => (
              <div key={msg.id} className="text-sm text-neutral-200 leading-relaxed font-light">
                {msg.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 md:p-3">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello! 👋</p>
          </div>
        ) : (
          regularMessages.map((msg, index) => (
            <div
              key={msg.id || index}
              className="flex gap-3"
            >
              <UserAvatar
                src={msg.avatar}
                name={msg.isAdminMessage ? 'Team Codekaro' : msg.name}
                email={msg.email}
                className="w-8 h-8 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm truncate text-white">
                    {msg.isAdminMessage ? 'Team Codekaro' : msg.name}
                  </span>
                  <span className="text-xs text-neutral-500 ml-auto shrink-0">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm wrap-break-word font-light">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 md:p-3">
        <form onSubmit={handleSubmit} className="relative flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 focus-within:border-neutral-700 transition-all duration-300 group">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Tap here to send your message"
            disabled={isSending}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none w-full min-w-0"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className={`
              flex items-center justify-center h-9 w-9 rounded-full transition-all duration-300 shrink-0
              ${(!input.trim() || isSending)
                ? 'bg-neutral-800 text-neutral-500 scale-95 opacity-50 cursor-not-allowed'
                : 'bg-white text-black hover:bg-neutral-200 shadow-md'
              }
            `}
          >
            {isSending ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 7-7 7 7"></path>
                <path d="M12 19V5"></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
