import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Trash2,
  Sparkles, 
  Reply, 
  Pin,
  SendHorizontal,
  MoreVertical,
  X,
  Megaphone,
  Zap,
  Plus,
  Pencil,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuickReplyTemplates } from '@/hooks/useQuickReplyTemplates';
import { useBroadcastTemplates } from '@/hooks/useBroadcastTemplates';
import { SlashCommandDropdown } from '@/components/admin/SlashCommandDropdown';
import { BroadcastMessage } from '@/components/BroadcastMessage';
import type { Message, QuickReplyTemplate } from '@/types';

interface AdminChatPanelProps {
  messages: Message[];
  pinnedMessages: Message[];
  onSendMessage: (text: string, isAdmin: boolean, targetUser?: { id: string, email: string, name: string }) => Promise<void>;
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
  onPinMessage,
  onUnpinMessage,
  onDeleteMessage,
  onClearChat,
  isSending,
}: AdminChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isClearChatOpen, setIsClearChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Quick Reply Templates
  const { templates: quickReplies, createTemplate, updateTemplate, deleteTemplate } = useQuickReplyTemplates();
  const { templates: broadcastTemplates } = useBroadcastTemplates();
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateKeyword, setNewTemplateKeyword] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null);
  const [editText, setEditText] = useState('');
  const [editKeyword, setEditKeyword] = useState('');

  // Slash Command State
  const [showSlashCommand, setShowSlashCommand] = useState(false);
  const [slashFilterText, setSlashFilterText] = useState('');
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    
    // Close slash command if open
    setShowSlashCommand(false);
    
    await onSendMessage(inputText.trim(), true, replyTo || undefined);
    setInputText('');
    setReplyTo(null);
  };

  // Get filtered templates for slash command
  const getFilteredTemplates = useCallback(() => {
    return [
      ...quickReplies.filter(t => t.keyword && t.keyword.toLowerCase().startsWith(slashFilterText.toLowerCase())),
      ...broadcastTemplates.filter(t => t.keyword && t.keyword.toLowerCase().startsWith(slashFilterText.toLowerCase())),
    ];
  }, [quickReplies, broadcastTemplates, slashFilterText]);

  // Handle input change with slash command detection
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    // Check for slash command at the start of input
    if (value.startsWith('/')) {
      setShowSlashCommand(true);
      setSlashFilterText(value.slice(1)); // Remove the slash
      setSlashSelectedIndex(0);
    } else {
      setShowSlashCommand(false);
      setSlashFilterText('');
    }
  }, []);

  // Handle slash command selection
  const handleSlashSelect = useCallback((text: string) => {
    setInputText(text);
    setShowSlashCommand(false);
    setSlashFilterText('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle slash command navigation
    if (showSlashCommand) {
      const filtered = getFilteredTemplates();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && filtered.length > 0) {
        e.preventDefault();
        handleSlashSelect(filtered[slashSelectedIndex].text);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashCommand(false);
        return;
      }
    }

    // Normal enter to send
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
    <div className="flex flex-col h-full bg-transparent text-white">
      {/* Header */}
      <div className="h-14 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/50 backdrop-blur-md shrink-0">
        <h2 className="text-xs font-normal text-neutral-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Chat
        </h2>
        <button
          onClick={() => setIsClearChatOpen(true)}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 hover:text-destructive group/clear"
          title="Clear all messages"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Pinned Section / Broadcast Banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3 flex items-start gap-3 shrink-0 relative group">
          <div className="mt-0.5 shrink-0">
            <Megaphone className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider mb-0.5">Admin Announcement</p>
            {pinnedMessages.map(msg => (
              <p key={msg.id} className="text-xs text-neutral-200 line-clamp-2 leading-relaxed">
                {msg.message}
              </p>
            ))}
          </div>
          <button 
            onClick={() => pinnedMessages.forEach(msg => onUnpinMessage(msg.id!))}
            className="p-1 hover:bg-orange-500/20 rounded transition-colors text-orange-500 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
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
          messages.map((msg) => {
            const isAdmin = msg.isAdminMessage;
            const isBroadcast = msg.messageType === 'broadcast';
            
            // Check for join messages
            if (isJoinMessage(msg.message)) {
              return (
                <div key={msg.id} className="py-1 px-4 text-center">
                  <span className="text-[10px] text-neutral-500 font-medium bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500 inline mr-0.5" />
                    <span className="text-neutral-300 font-normal">{msg.name}</span> joined
                  </span>
                </div>
              );
            }

            const theme = !isAdmin && !isBroadcast ? getAvatarColor(msg.name) : null;

            return (
              <div 
                key={msg.id} 
                onClick={() => {
                  if (!isAdmin && !isBroadcast) {
                    setReplyTo({ id: msg.userId, email: msg.email, name: msg.name });
                  }
                }}
                className={`group relative flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 hover:bg-neutral-800/50 px-2 py-1 -mx-2 rounded-xl transition-colors ${!isAdmin && !isBroadcast ? 'cursor-pointer' : ''}`}
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
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className={`font-normal text-[11px] ${isAdmin ? 'text-primary' : isBroadcast ? 'text-amber-400' : 'text-neutral-200'}`}>
                      {msg.name}
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
                        compact={true}
                      />
                    </div>
                  ) : (
                    <div className={`text-[14px] mt-0.5 leading-relaxed transition-colors ${
                      isBroadcast ? 'text-amber-200/90 group-hover:text-amber-100' : 
                      msg.messageType === 'private' ? 'text-purple-200/90 group-hover:text-purple-100' : 
                      'text-neutral-400 group-hover:text-neutral-300'
                    }`}>
                      {renderMessageWithLinks(msg.message, isAdmin || isBroadcast)}
                    </div>
                  )}

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
      <div className="px-4 pb-4 bg-neutral-900 border-t border-neutral-800 shrink-0">
        {/* Quick Replies Toggle */}
        <button
          onClick={() => setShowQuickReplies(!showQuickReplies)}
          className="flex items-center gap-2 py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors w-full"
        >
          {showQuickReplies ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Zap className="w-3 h-3" />
          <span>Quick Replies</span>
          <span className="text-neutral-600 ml-1">({quickReplies.length})</span>
        </button>

        {/* Quick Replies Panel */}
        {showQuickReplies && (
          <div className="mb-3 p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50 animate-in slide-in-from-top-2 duration-200">
            {isManagingTemplates ? (
              // Management Mode
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-neutral-400 uppercase">Manage Templates</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsManagingTemplates(false)} className="h-6 px-2 text-xs">
                    Done
                  </Button>
                </div>
                
                {/* Add New Template */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="/keyword"
                      value={newTemplateKeyword}
                      onChange={(e) => setNewTemplateKeyword(e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase())}
                      className="h-8 text-xs w-24"
                    />
                    <Input
                      type="text"
                      placeholder="Quick reply text..."
                      value={newTemplateText}
                      onChange={(e) => setNewTemplateText(e.target.value)}
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTemplateText.trim() && newTemplateKeyword.trim()) {
                          createTemplate(newTemplateText, newTemplateKeyword);
                          setNewTemplateText('');
                          setNewTemplateKeyword('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newTemplateText.trim() && newTemplateKeyword.trim()) {
                          createTemplate(newTemplateText, newTemplateKeyword);
                          setNewTemplateText('');
                          setNewTemplateKeyword('');
                        }
                      }}
                      disabled={!newTemplateText.trim() || !newTemplateKeyword.trim()}
                      className="h-8 px-2"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-neutral-500">Keyword is used for /{'{keyword}'} slash command</p>
                </div>
                
                {/* Template List with Edit/Delete */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {quickReplies.map((template) => (
                    <div key={template.id} className="flex items-center gap-2 group bg-neutral-800/30 rounded-lg px-2 py-1.5">
                      {editingTemplate?.id === template.id ? (
                        <>
                          <Input
                            type="text"
                            value={editKeyword}
                            onChange={(e) => setEditKeyword(e.target.value.replace(/[^a-z0-9]/gi, '').toLowerCase())}
                            className="h-7 text-xs w-20"
                            placeholder="keyword"
                          />
                          <Input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="h-7 text-xs flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editText.trim() && editKeyword.trim()) {
                                updateTemplate(template.id!, editText, editKeyword);
                                setEditingTemplate(null);
                              } else if (e.key === 'Escape') {
                                setEditingTemplate(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (editText.trim() && editKeyword.trim()) {
                                updateTemplate(template.id!, editText, editKeyword);
                                setEditingTemplate(null);
                              }
                            }}
                            className="h-7 w-7 p-0 text-emerald-500"
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTemplate(null)}
                            className="h-7 w-7 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-violet-400 font-mono bg-violet-500/10 px-1.5 py-0.5 rounded">/{template.keyword || '?'}</span>
                          <span className="text-xs text-neutral-300 flex-1 truncate">{template.text}</span>
                          <button
                            onClick={() => {
                              setEditingTemplate(template);
                              setEditText(template.text);
                              setEditKeyword(template.keyword || '');
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-neutral-300 transition-opacity"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(template.id!)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-destructive transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  {quickReplies.length === 0 && (
                    <p className="text-xs text-neutral-500 text-center py-2">No templates yet</p>
                  )}
                </div>
              </div>
            ) : (
              // Quick Use Mode
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-neutral-400 uppercase">Quick Replies</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsManagingTemplates(true)} className="h-6 px-2 text-xs">
                    Manage
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickReplies.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setInputText(template.text)}
                      className="px-2.5 py-1 bg-neutral-700/50 hover:bg-neutral-700 border border-neutral-600/50 rounded-md text-xs text-neutral-300 hover:text-neutral-100 transition-colors truncate max-w-[150px]"
                    >
                      {template.text}
                    </button>
                  ))}
                  {quickReplies.length === 0 && (
                    <p className="text-xs text-neutral-500">Click "Manage" to add templates</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reply Preview Bar */}
        {replyTo && (
          <div className="flex items-center justify-between py-3 border-b border-neutral-800 mb-2 animate-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <Reply className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <p className="text-xs text-neutral-400 truncate">
                Replying to <span className="text-neutral-100 font-medium">{replyTo.name}</span>
              </p>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <button 
                onClick={() => setReplyTo(null)}
                className="text-neutral-500 hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="relative group mt-4">
          {/* Slash Command Dropdown */}
          <SlashCommandDropdown
            quickReplies={quickReplies}
            broadcastTemplates={broadcastTemplates}
            filterText={slashFilterText}
            visible={showSlashCommand}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlashCommand(false)}
            selectedIndex={slashSelectedIndex}
            onSelectedIndexChange={setSlashSelectedIndex}
          />
          
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type / for slash commands..."
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
