import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Trash2, 
  Smile, 
  Sparkles, 
  Reply, 
  Pin,
  SendHorizontal,
  MoreVertical,
  BellRing,
  X
} from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="px-5 py-3 border-b border-white/5 flex justify-between items-center bg-[#0a0a0a]/50 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-5 h-5 text-white/80" />
          <span className="font-semibold text-[15px] tracking-tight text-white/90">Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsClearChatOpen(true)}
            className="text-white/40 hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20">
            <MessageSquare className="w-10 h-10 opacity-20 mb-3" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.isAdminMessage;
            const isBroadcast = msg.messageType === 'broadcast';
            
            // Check for join messages
            if (isJoinMessage(msg.message)) {
              return (
                <div key={msg.id} className="py-1 px-4 text-center">
                  <span className="text-[10px] text-neutral-500 font-medium bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50 inline-flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span className="text-neutral-300 font-normal">{msg.name}</span> joined
                  </span>
                </div>
              );
            }

            const theme = !isAdmin && !isBroadcast ? getAvatarColor(msg.name) : null;

            return (
              <div 
                key={msg.id} 
                className="group relative flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 hover:bg-neutral-800/50 px-2 py-1 -mx-2 rounded-xl transition-colors cursor-pointer"
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
                      {getInitials(msg.name)}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-[11px] font-normal tracking-tight ${
                      isAdmin ? 'text-primary' : 
                      isBroadcast ? 'text-amber-400' : 
                      'text-neutral-200'
                    }`}>
                      {msg.name} {isAdmin && <span className="text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700/50 px-1.5 py-0.5 rounded-full ml-1 font-medium not-italic">Host</span>}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      {msg.timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                  
                  <div className={`text-[14px] leading-relaxed wrap-break-word mt-0.5 transition-colors ${
                    isBroadcast ? 'text-amber-200/90 group-hover:text-amber-100' : 
                    msg.messageType === 'private' ? 'text-purple-200/90 group-hover:text-purple-100' : 
                    'text-neutral-400 group-hover:text-neutral-300'
                  }`}>
                    {renderMessageWithLinks(msg.message, isAdmin || isBroadcast)}
                  </div>

                  {/* Private Reply Indicator */}
                  {msg.messageType === 'private' && msg.targetUserName && (
                    <div className="mt-1 text-[9px] text-purple-400/80 font-medium flex items-center gap-1.5">
                      <Pin className="w-2.5 h-2.5 rotate-45" />
                      Private reply to {msg.targetUserName}
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute -top-4 right-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-neutral-900/90 backdrop-blur-md rounded-lg p-0.5 border border-white/10 transition-all z-20 shadow-xl">
                    {!msg.isPinned && isBroadcast && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPinMessage(msg.id!);
                        }}
                        className="p-1.5 text-white/40 hover:text-amber-500 hover:bg-white/10 rounded-md transition-colors"
                        title="Pin"
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {!isAdmin && !isBroadcast && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplyTo({ id: msg.userId, email: msg.email, name: msg.name });
                        }}
                        className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                        title="Reply"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMessageToDelete(msg.id!);
                      }}
                      className="p-1.5 text-white/40 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-4 bg-[#0a0a0a] border-t border-white/5 shrink-0">
        {/* Reply/Broadcast Bar */}
        {(replyTo || isBroadcastMode) && (
          <div className="flex items-center justify-between py-3 border-b border-neutral-800 mb-2 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <p className="text-xs text-neutral-400 truncate">
                {isBroadcastMode ? (
                  <span className="text-amber-500 font-bold uppercase tracking-widest text-[10px]">Broadcast Mode</span>
                ) : (
                  <>Replying to <span className="text-neutral-100 font-medium">{replyTo?.name}</span></>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <div 
                className="flex items-center gap-2 cursor-pointer group" 
                onClick={() => setIsBroadcastMode(!isBroadcastMode)}
              >
                <BellRing className={`w-3.5 h-3.5 transition-colors ${isBroadcastMode ? 'text-amber-500' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                <span className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${isBroadcastMode ? 'text-amber-500' : 'text-neutral-500 group-hover:text-neutral-300'}`}>
                  Broadcast
                </span>
                <div className={`w-8 h-4.5 rounded-full relative transition-colors ${isBroadcastMode ? 'bg-amber-600' : 'bg-neutral-700'}`}>
                  <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${isBroadcastMode ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setReplyTo(null);
                  setIsBroadcastMode(false);
                }}
                className="text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="relative group mt-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tap here to send your message"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2.5 px-4 pr-10 text-xs text-neutral-100 placeholder-neutral-500 focus:bg-neutral-800/50 focus:border-neutral-600 transition-all outline-none"
            disabled={isSending}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {inputText.trim() ? (
              <button 
                onClick={handleSend}
                disabled={isSending}
                className="text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 border-none bg-transparent shadow-none" side="top" align="end">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={(emojiData) => setInputText(prev => prev + emojiData.emoji)}
                    width={300}
                    height={400}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </div>

      {/* Clear Chat Dialog */}
      <AlertDialog open={isClearChatOpen} onOpenChange={setIsClearChatOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all messages?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All messages in this session will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onClearChat();
                setIsClearChatOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Clear Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Message Dialog */}
      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              This specific message will be removed from the chat for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (messageToDelete) {
                  onDeleteMessage(messageToDelete);
                  setMessageToDelete(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
