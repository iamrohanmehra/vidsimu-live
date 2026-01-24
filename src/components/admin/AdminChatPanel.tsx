import { useRef, useEffect } from 'react';
import type { Message } from '@/types';

interface AdminChatPanelProps {
  messages: Message[];
  pinnedMessages: Message[];
  onSendMessage: (text: string, isAdmin: boolean, targetUser?: { id: string, email: string, name: string }) => Promise<void>;
  onSendBroadcast: (text: string) => Promise<void>;
  onPinMessage: (messageId: string) => Promise<void>;
  onUnpinMessage: (messageId: string) => Promise<void>;
  onClearChat: () => Promise<void>;
  isSending: boolean;
}

interface ReplyTarget {
  id: string;
  email: string;
  name: string;
}

export function AdminChatPanel({
  messages,
  pinnedMessages,
  onSendMessage,
  onSendBroadcast,
  onPinMessage,
  onUnpinMessage,
  onClearChat,
  isSending,
}: AdminChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    
    if (isBroadcastMode) {
      await onSendBroadcast(inputText.trim());
      setIsBroadcastMode(false);
    } else {
      await onSendMessage(inputText.trim(), true, replyTo || undefined);
    }
    setInputText('');
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper for avatar initials
  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full bg-black border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center bg-black">
        <h2 className="font-semibold text-neutral-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Live Chat Console
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">{messages.length} messages</span>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear the entire chat history? This action cannot be undone.')) {
                onClearChat();
              }
            }}
            className="text-neutral-500 hover:text-red-500 transition-colors p-1"
            title="Clear All Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Pinned Section (Overlay) */}
      {/* Pinned Section (Overlay) */}
      {pinnedMessages.length > 0 && (
        <div className="bg-black border-b border-neutral-800 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-neutral-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
              Active Broadcast
            </div>
            <button 
              onClick={() => pinnedMessages.forEach(msg => onUnpinMessage(msg.id!))}
              className="text-[10px] font-medium px-2 py-1 bg-neutral-800 hover:bg-red-500/10 hover:text-red-400 text-neutral-400 rounded transition-colors"
            >
              End Broadcast
            </button>
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

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
            <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.isAdminMessage;
            const isBroadcast = msg.messageType === 'broadcast';
            
            return (
              <div 
                key={msg.id} 
                className={`group flex gap-3 ${isAdmin || isBroadcast ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isAdmin ? 'bg-violet-600 text-white shadow-violet-500/20 shadow-lg' :
                  isBroadcast ? 'bg-amber-500 text-black' :
                  'bg-neutral-800 text-neutral-400'
                }`}>
                  {isBroadcast ? '📢' : (msg.avatar ? <img src={msg.avatar} className="w-full h-full rounded-full object-cover" /> : getInitials(msg.name))}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[85%] ${isAdmin || isBroadcast ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className={`text-xs font-medium ${isAdmin ? 'text-violet-400' : isBroadcast ? 'text-amber-500' : 'text-neutral-400'}`}>
                      {msg.name} {isAdmin && '(Host)'} {isBroadcast && '(Broadcast)'}
                    </span>
                    <span className="text-[10px] text-neutral-600">
                      {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isBroadcast ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-tr-sm' :
                    isAdmin ? 'bg-violet-600/20 border border-violet-500/30 text-violet-100 rounded-tr-sm' :
                    'bg-neutral-800 text-neutral-200 rounded-tl-sm'
                  }`}>
                    {msg.message}
                    
                    {/* Hover Actions */}
                    <div className={`absolute top-0 ${isAdmin ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                      {!msg.isPinned && (
                        <button 
                          onClick={() => onPinMessage(msg.id!)}
                          className="p-1 text-neutral-500 hover:text-amber-400 bg-neutral-900/80 rounded"
                          title="Pin"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        </button>
                      )}
                      {!isAdmin && !isBroadcast && (
                        <button
                          onClick={() => {
                            setReplyTo({ id: msg.userId, email: msg.email, name: msg.name });
                            setIsBroadcastMode(false);
                          }}
                          className="p-1 text-neutral-500 hover:text-violet-400 bg-neutral-900/80 rounded"
                          title="Reply Privately"
                        >
                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t transition-colors ${isBroadcastMode ? 'border-amber-500/50 bg-amber-500/5' : 'border-neutral-800 bg-black'}`}>
        {isBroadcastMode && (
          <div className="flex items-center gap-2 mb-2 text-amber-500 text-xs font-bold uppercase tracking-wide animate-pulse">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>
            Broadcast Mode Active
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            {replyTo && (
              <div className="absolute left-0 -top-8 flex items-center gap-2 bg-neutral-800 text-neutral-300 text-xs px-3 py-1 rounded-t-lg border-t border-x border-neutral-700">
                <span>Replying to <span className="font-semibold text-white">{replyTo.name}</span></span>
                <button onClick={() => setReplyTo(null)} className="hover:text-white">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            )}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isBroadcastMode ? "Type a broadcast message..." : replyTo ? `Message to ${replyTo.name}...` : "Select a message to reply or enable Broadcast"}
              className={`w-full bg-neutral-950 border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none transition-all ${
                isBroadcastMode 
                  ? 'border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 placeholder-amber-700' 
                  : 'border-neutral-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 placeholder-neutral-600'
              }`}
              disabled={isSending}
            />
          </div>
          
          <button
            onClick={() => setIsBroadcastMode(!isBroadcastMode)}
            className={`p-2.5 rounded-lg border transition-all ${
              isBroadcastMode 
                ? 'bg-amber-500 text-black border-amber-600 hover:bg-amber-400' 
                : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-amber-500 hover:border-amber-500/50'
            }`}
            title="Toggle Broadcast Mode"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
          </button>
          
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || (!isBroadcastMode && !replyTo)}
            className={`px-6 rounded-lg font-medium text-sm transition-all ${
              isBroadcastMode
                ? 'bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50'
                : replyTo 
                  ? 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
            }`}
            title={!isBroadcastMode && !replyTo ? "Select 'Reply' or toggle 'Broadcast' to send" : "Send Message"}
          >
            Send
          </button>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
      `}</style>
    </div>
  );
}

import { useState } from 'react';
