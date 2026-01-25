import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Message } from '@/types';

interface AdminChatPanelProps {
  messages: Message[];
  pinnedMessages: Message[];
  onSendMessage: (text: string, isAdmin: boolean, targetUser?: { id: string, email: string, name: string }) => Promise<void>;
  onSendBroadcast: (text: string) => Promise<void>;
  onPinMessage: (messageId: string) => Promise<void>;
  onUnpinMessage: (messageId: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
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
  onDeleteMessage,
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

  const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-medium text-foreground">Live Chat</span>
          <span className="text-xs text-muted-foreground ml-2">{messages.length}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (window.confirm('Clear all messages?')) {
              onClearChat();
            }
          }}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          title="Clear Chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </Button>
      </div>

      {/* Pinned Section */}
      {pinnedMessages.length > 0 && (
        <div className="border-b border-border px-4 py-3 bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Broadcast
            </div>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => pinnedMessages.forEach(msg => onUnpinMessage(msg.id!))}
              className="h-6 text-xs text-muted-foreground hover:text-destructive"
            >
              End
            </Button>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {pinnedMessages.map(msg => (
              <p key={msg.id} className="text-sm text-foreground">
                {msg.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <svg className="w-8 h-8 opacity-30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
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
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isAdmin ? 'bg-primary text-primary-foreground' :
                  isBroadcast ? 'bg-amber-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {isBroadcast ? '📢' : (msg.avatar ? <img src={msg.avatar} className="w-full h-full rounded-full object-cover" alt="" /> : getInitials(msg.name))}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[80%] ${isAdmin || isBroadcast ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-xs font-medium ${isAdmin ? 'text-primary' : isBroadcast ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                      {msg.name} {isAdmin && '(Host)'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className={`relative px-3 py-2 rounded-lg text-sm ${
                    isBroadcast ? 'bg-amber-500/10 border border-amber-500/20 text-foreground' :
                    isAdmin ? 'bg-primary/10 border border-primary/20 text-foreground' :
                    'bg-muted text-foreground'
                  }`}>
                    {renderMessageWithLinks(msg.message, isAdmin || isBroadcast)}
                    
                    {/* Hover Actions */}
                    <div className={`absolute top-1 ${isAdmin ? '-left-7' : '-right-7'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-0.5`}>
                      {/* Pin Button - Only for Broadcast messages that are unpinned */ }
                      {!msg.isPinned && isBroadcast && (
                        <button 
                          onClick={() => onPinMessage(msg.id!)}
                          className="p-1 text-muted-foreground hover:text-amber-500 rounded"
                          title="Pin"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                        </button>
                      )}
                      {/* Reply Button - Only for user messages */ }
                      {!isAdmin && !isBroadcast && (
                        <button
                          onClick={() => {
                            setReplyTo({ id: msg.userId, email: msg.email, name: msg.name });
                            setIsBroadcastMode(false);
                          }}
                          className="p-1 text-muted-foreground hover:text-primary rounded"
                          title="Reply"
                        >
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                        </button>
                      )}
                          <button
                            onClick={() => {
                              if (window.confirm('Delete this message?')) {
                                onDeleteMessage(msg.id!);
                              }
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive rounded"
                            title="Delete"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
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
      <div className={`p-4 border-t border-border ${isBroadcastMode ? 'bg-amber-500/5' : ''}`}>
        {isBroadcastMode && (
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd" /></svg>
            Broadcast Mode
          </div>
        )}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
            <span>Replying to <span className="font-medium text-foreground">{replyTo.name}</span></span>
            <button onClick={() => setReplyTo(null)} className="hover:text-foreground">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBroadcastMode ? "Broadcast message..." : replyTo ? `Reply to ${replyTo.name}...` : "Reply or broadcast"}
            className={isBroadcastMode ? 'border-amber-500/50 focus-visible:ring-amber-500' : ''}
            disabled={isSending}
          />
          
          <Button
            variant={isBroadcastMode ? "default" : "outline"}
            size="icon"
            onClick={() => setIsBroadcastMode(!isBroadcastMode)}
            className={isBroadcastMode ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
            title="Toggle Broadcast"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isSending || (!isBroadcastMode && !replyTo)}
            className={isBroadcastMode ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            Send
          </Button>
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
