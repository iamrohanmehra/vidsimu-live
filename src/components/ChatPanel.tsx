import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex flex-col h-full bg-neutral-900/50 backdrop-blur-sm">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Be the first to say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`flex gap-2 ${msg.isAdminMessage ? 'bg-violet-500/10 p-2 rounded-lg border border-violet-500/20' : ''}`}
            >
              <img
                src={msg.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.name)}&background=8b5cf6&color=fff`}
                alt={msg.name}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className={`font-semibold text-sm truncate ${msg.isAdminMessage ? 'text-violet-400' : 'text-white'}`}>
                    {msg.name}
                    {msg.isAdminMessage && (
                      <span className="ml-1 text-xs bg-violet-500/30 px-1.5 py-0.5 rounded text-violet-300">Admin</span>
                    )}
                  </span>
                  <span className="text-xs text-neutral-500 flex-shrink-0">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-neutral-300 text-sm break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-neutral-800">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isSending}
            size="icon"
            className="bg-violet-600 hover:bg-violet-500 text-white h-9 w-9 shrink-0"
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>
        <div className="flex justify-between mt-1 text-xs text-neutral-500">
          <span>{input.length}/{MAX_MESSAGE_LENGTH}</span>
          <span>Press Enter to send</span>
        </div>
      </form>
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
