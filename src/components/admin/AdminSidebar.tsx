import { useState } from 'react';
import { 
  UsersRound, 
  Megaphone, 
  Vote, 
  Link,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminViewersList } from '@/components/admin/AdminViewersList';
import { AdminPollManager } from '@/components/admin/AdminPollManager';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBroadcastTemplates } from '@/hooks/useBroadcastTemplates';
import { useBannedUsers } from '@/hooks/useBannedUsers';
import type { Event, BroadcastTemplate } from '@/types';

interface AdminSidebarProps {
  id: string;
  event: Event;
  viewers: any[];
  viewerCount: number;
  isPreviewMuted: boolean;
  setIsPreviewMuted: (muted: boolean) => void;
  broadcastText: string;
  setBroadcastText: (text: string) => void;
  handleSendBroadcast: (text: string) => void;
  isSending: boolean;
}

export function AdminSidebar({
  id,
  event,
  viewers,
  viewerCount,
  isPreviewMuted,
  setIsPreviewMuted,
  broadcastText,
  setBroadcastText,
  handleSendBroadcast,
  isSending
}: AdminSidebarProps) {
  // Broadcast Templates
  const { templates: broadcastTemplates, createTemplate, updateTemplate, deleteTemplate } = useBroadcastTemplates();
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<BroadcastTemplate | null>(null);
  const [editText, setEditText] = useState('');

  // Banned Users
  const { bannedUsers, banUser, unbanUser } = useBannedUsers({ sessionId: id });
  return (
    <aside className="w-[350px] h-full border-l border-neutral-800 bg-neutral-900 flex flex-col shrink-0 relative transition-colors">
      {/* Instructor Video at the top */}
      <div className="aspect-video bg-neutral-800 relative overflow-hidden shrink-0 border-b border-neutral-800">
        <VideoPlayer
          url={event.url}
          muted={isPreviewMuted}
          onMuteChange={setIsPreviewMuted}
          isFaceVideo={true}
          objectFit="cover"
          streamStartTime={event.time ? new Date(event.time).getTime() : Date.now()}
          className="w-full h-full"
          instructorName={event.instructor || 'Ashish Shukla'}
        />
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Custom Tabs Navigation */}
        <div className="h-14 border-b border-neutral-800 flex items-center bg-neutral-900/50 backdrop-blur-md shrink-0">
          <TabsList variant="line" className="w-full h-full p-0 bg-transparent flex border-none rounded-none">
            <TabsTrigger 
              value="users" 
              className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10"
            >
              <UsersRound className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger 
              value="broadcast" 
              className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10"
            >
              <Megaphone className="w-3.5 h-3.5" /> Broadcast
            </TabsTrigger>
            <TabsTrigger 
              value="polls" 
              className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10"
            >
              <Vote className="w-3.5 h-3.5" /> Polls
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-hidden relative bg-neutral-900/50">
          {/* Users Tab */}
          <TabsContent value="users" className="absolute inset-0 m-0 data-[state=active]:flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden">
              <AdminViewersList 
                viewers={viewers} 
                viewerCount={viewerCount}
                bannedUsers={bannedUsers}
                onBanUser={banUser}
                onUnbanUser={unbanUser}
              />
            </div>
          </TabsContent>

          {/* Broadcast Tab */}
          <TabsContent value="broadcast" className="absolute inset-0 m-0 data-[state=active]:flex flex-col">
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <h3 className="text-xs font-normal text-neutral-400 uppercase tracking-wider px-1">Broadcast Tool</h3>
                <div className="space-y-3">
                  <textarea 
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Type an announcement..." 
                    className="w-full h-28 bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-xs text-neutral-100 placeholder-neutral-500 focus:bg-neutral-800/50 focus:border-orange-500/50 transition-all outline-none resize-none"
                  ></textarea>
                  <div className="relative group">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input 
                      type="url" 
                      placeholder="Link (Optional)..." 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-9 pr-4 text-xs text-neutral-100 focus:border-orange-500/50 outline-none"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (broadcastText.trim()) {
                        handleSendBroadcast(broadcastText);
                        setBroadcastText('');
                      }
                    }}
                    disabled={isSending || !broadcastText.trim()}
                    className="w-full py-3 px-4 bg-white text-neutral-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                  >
                    Send Broadcast
                  </Button>
                </div>
              </div>

              {/* Broadcast Templates Section */}
              <div className="space-y-4 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-normal text-neutral-500 uppercase tracking-widest">Broadcast Templates</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsManagingTemplates(!isManagingTemplates)} 
                    className="h-6 px-2 text-[10px]"
                  >
                    {isManagingTemplates ? 'Done' : 'Manage'}
                  </Button>
                </div>

                {isManagingTemplates ? (
                  // Management Mode
                  <div className="space-y-3">
                    {/* Add New Template */}
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="New template text..."
                        value={newTemplateText}
                        onChange={(e) => setNewTemplateText(e.target.value)}
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTemplateText.trim()) {
                            createTemplate(newTemplateText);
                            setNewTemplateText('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newTemplateText.trim()) {
                            createTemplate(newTemplateText);
                            setNewTemplateText('');
                          }
                        }}
                        disabled={!newTemplateText.trim()}
                        className="h-8 px-2"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Template List with Edit/Delete */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {broadcastTemplates.map((template) => (
                        <div key={template.id} className="flex items-center gap-2 group bg-neutral-800/30 rounded-lg px-3 py-2">
                          {editingTemplate?.id === template.id ? (
                            <>
                              <Input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="h-7 text-xs flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editText.trim()) {
                                    updateTemplate(template.id!, { text: editText });
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
                                  updateTemplate(template.id!, { text: editText });
                                  setEditingTemplate(null);
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
                              <span className="text-xs text-neutral-300 flex-1 truncate">{template.text}</span>
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setEditText(template.text);
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
                      {broadcastTemplates.length === 0 && (
                        <p className="text-xs text-neutral-500 text-center py-3">No templates yet. Add one above.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Quick Use Mode - Click to use template
                  <div className="grid grid-cols-1 gap-2">
                    {broadcastTemplates.map((template) => (
                      <button 
                        key={template.id}
                        onClick={() => setBroadcastText(template.text)}
                        className="text-left px-4 py-3 bg-neutral-800/50 border border-neutral-800 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700 transition-all truncate"
                      >
                        {template.text}
                      </button>
                    ))}
                    {broadcastTemplates.length === 0 && (
                      <p className="text-xs text-neutral-500 text-center py-3">Click "Manage" to add templates</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Polls Tab */}
          <TabsContent value="polls" className="absolute inset-0 m-0 data-[state=active]:flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden">
              <AdminPollManager streamId={id} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
