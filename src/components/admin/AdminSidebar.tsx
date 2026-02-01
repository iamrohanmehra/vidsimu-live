import { useState } from 'react';
import { 
  UsersRound, 
  Megaphone, 
  BarChart2, 
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
import type { Event, BroadcastTemplate, Viewer } from '@/types';

interface AdminSidebarProps {
  id: string;
  event: Event;
  viewers: Viewer[];
  viewerCount: number;
  isPreviewMuted: boolean;
  setIsPreviewMuted: (muted: boolean) => void;
  broadcastText: string;
  setBroadcastText: (text: string) => void;
  handleSendBroadcast: (text: string, options?: { link?: string; showQrCode?: boolean }) => void;
  isSending: boolean;
  effectiveStreamStart?: number; // Add prop for synced timing
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
  isSending,
  chatPanel,
  hideVideo = false,
  effectiveStreamStart,
  isConnecting = false
}: AdminSidebarProps & { chatPanel?: React.ReactNode; hideVideo?: boolean; isConnecting?: boolean }) {
  // Broadcast Templates
  const { templates: broadcastTemplates, createTemplate, updateTemplate, deleteTemplate } = useBroadcastTemplates();
  const [isManagingTemplates, setIsManagingTemplates] = useState(false);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateKeyword, setNewTemplateKeyword] = useState('');
  const [newTemplateLink, setNewTemplateLink] = useState('');
  const [newTemplateShowQr, setNewTemplateShowQr] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BroadcastTemplate | null>(null);
  const [editText, setEditText] = useState('');
  const [editKeyword, setEditKeyword] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editShowQr, setEditShowQr] = useState(false);

  // Current broadcast input state
  const [broadcastLink, setBroadcastLink] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  // Banned Users
  const { bannedUsers, banUser, unbanUser } = useBannedUsers({ sessionId: id });

  // Use a stable fallback for stream start time if event.time is missing
  // Use effectiveStreamStart if provided, otherwise fallback to event time or mount time
  // This ensures the sidebar preview matches the main player's 5s delay
  const [mountTime] = useState(() => Date.now());
  const resolvedStreamStart = effectiveStreamStart ?? (event.time ? new Date(event.time).getTime() : mountTime);

  return (

    <aside className="w-full lg:w-[350px] h-full border-l border-neutral-800 bg-neutral-900 flex flex-col shrink-0 relative transition-colors">
      {/* Instructor Video at the top */}
      {!hideVideo && (
        <div className="aspect-video bg-neutral-800 relative overflow-hidden shrink-0 border-b border-neutral-800">
          <VideoPlayer
            url={event.url}
            muted={isPreviewMuted}
            onMuteChange={setIsPreviewMuted}
            isFaceVideo={true}
            objectFit="cover"
            streamStartTime={resolvedStreamStart}
            className="w-full h-full"
            instructorName={event.instructor || 'Ashish Shukla'}
          />
          {isConnecting && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center">
               <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue={chatPanel ? "chat" : "users"} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Custom Tabs Navigation */}
        <div className="h-14 border-b border-neutral-800 flex items-center bg-neutral-900/50 backdrop-blur-md shrink-0 overflow-x-auto no-scrollbar">
          <TabsList variant="line" className="w-full h-full p-0 bg-transparent flex border-none rounded-none min-w-max px-4 lg:px-0">
             {chatPanel && (
              <TabsTrigger 
                value="chat" 
                className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10 min-w-[80px]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse lg:hidden block" /> 
                  Chat
                </div>
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="users" 
              className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10 min-w-[80px]"
            >
              <UsersRound className="w-3.5 h-3.5" /> Users
            </TabsTrigger>
            <TabsTrigger 
              value="broadcast" 
              className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10 min-w-[80px]"
            >
              <Megaphone className="w-3.5 h-3.5" /> Broadcast
            </TabsTrigger>
            <TabsTrigger 
              value="polls" 
              className="relative flex-1 h-full flex items-center justify-center gap-2 text-xs font-medium bg-transparent border-none data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-white text-neutral-500 hover:text-neutral-300 rounded-none shadow-none transition-all after:z-10 min-w-[80px]"
            >
              <BarChart2 className="w-3.5 h-3.5" /> Polls
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-hidden relative bg-neutral-900/50">
          {/* Chat Tab (Mobile Only typically) */}
          {chatPanel && (
            <TabsContent value="chat" className="absolute inset-0 m-0 p-0 data-[state=active]:flex flex-col">
              {chatPanel}
            </TabsContent>
          )}

          {/* Users Tab */}
          <TabsContent value="users" className="absolute inset-0 m-0 p-0 data-[state=active]:flex flex-col">
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
          <TabsContent value="broadcast" className="absolute inset-0 m-0 p-0 data-[state=active]:flex flex-col">
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <h3 className="text-xs font-normal text-neutral-400 uppercase tracking-wider px-1">Broadcast Tool</h3>
                <div className="space-y-3">
                  <textarea 
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Type an announcement (optional if link provided)..." 
                    className="w-full h-24 bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-xs text-neutral-100 placeholder-neutral-500 focus:bg-neutral-800/50 focus:border-orange-500/50 transition-all outline-none resize-none"
                  ></textarea>
                  
                  {/* Link input */}
                  <div className="relative group">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
                    <input 
                      type="url" 
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      placeholder="Link (Optional)..." 
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-lg py-2 pl-9 pr-4 text-xs text-neutral-100 focus:border-orange-500/50 outline-none"
                    />
                  </div>

                  {/* QR Code Toggle - only show when link is present */}
                  {broadcastLink.trim() && (
                    <label className="flex items-center gap-2 px-1 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
                      />
                      <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors">
                        Show QR Code for Link
                      </span>
                    </label>
                  )}

                  <Button 
                    onClick={() => {
                      if (broadcastText.trim() || broadcastLink.trim()) {
                        handleSendBroadcast(broadcastText, { 
                          link: broadcastLink.trim() || undefined,
                          showQrCode: showQrCode && broadcastLink.trim() ? true : false
                        });
                        setBroadcastText('');
                        setBroadcastLink('');
                        setShowQrCode(false);
                      }
                    }}
                    disabled={isSending || (!broadcastText.trim() && !broadcastLink.trim())}
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
                    <div className="space-y-2">
                      {/* First row: keyword and text */}
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
                          placeholder="Broadcast text (optional if link)..."
                          value={newTemplateText}
                          onChange={(e) => setNewTemplateText(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                      {/* Second row: link */}
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Link (optional)..."
                          value={newTemplateLink}
                          onChange={(e) => setNewTemplateLink(e.target.value)}
                          className="h-8 text-xs flex-1"
                        />
                      </div>
                      {/* Third row: QR toggle and add button */}
                      <div className="flex items-center justify-between">
                        {newTemplateLink.trim() && (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newTemplateShowQr}
                              onChange={(e) => setNewTemplateShowQr(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-800"
                            />
                            <span className="text-[10px] text-neutral-400">Show QR Code</span>
                          </label>
                        )}
                        <Button
                          size="sm"
                          onClick={() => {
                            if ((newTemplateText.trim() || newTemplateLink.trim()) && newTemplateKeyword.trim()) {
                              createTemplate(newTemplateText, newTemplateKeyword, newTemplateLink || undefined, newTemplateShowQr);
                              setNewTemplateText('');
                              setNewTemplateKeyword('');
                              setNewTemplateLink('');
                              setNewTemplateShowQr(false);
                            }
                          }}
                          disabled={(!newTemplateText.trim() && !newTemplateLink.trim()) || !newTemplateKeyword.trim()}
                          className="h-7 px-3 text-xs ml-auto"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                      <p className="text-[9px] text-neutral-500">Keyword is used for /{'{keyword}'} slash command</p>
                    </div>
                    
                    {/* Template List with Edit/Delete */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {broadcastTemplates.map((template) => (
                        <div key={template.id} className="group bg-neutral-800/30 rounded-lg px-3 py-2">
                          {editingTemplate?.id === template.id ? (
                            <div className="space-y-2">
                              <div className="flex gap-2">
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
                                  placeholder="Text"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  type="url"
                                  value={editLink}
                                  onChange={(e) => setEditLink(e.target.value)}
                                  className="h-7 text-xs flex-1"
                                  placeholder="Link (optional)"
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                {editLink.trim() && (
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editShowQr}
                                      onChange={(e) => setEditShowQr(e.target.checked)}
                                      className="w-3.5 h-3.5 rounded border-neutral-600 bg-neutral-800"
                                    />
                                    <span className="text-[10px] text-neutral-400">Show QR</span>
                                  </label>
                                )}
                                <div className="flex gap-1 ml-auto">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if ((editText.trim() || editLink.trim()) && editKeyword.trim()) {
                                        updateTemplate(template.id!, { 
                                          text: editText, 
                                          keyword: editKeyword,
                                          link: editLink || undefined,
                                          showQrCode: editShowQr
                                        });
                                        setEditingTemplate(null);
                                      }
                                    }}
                                    className="h-7 px-2 text-emerald-500"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingTemplate(null)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">/{template.keyword || '?'}</span>
                                  <span className="text-xs text-neutral-300 truncate">{template.text || '(link only)'}</span>
                                </div>
                                {template.link && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Link className="w-3 h-3 text-violet-400" />
                                    <span className="text-[10px] text-violet-400 truncate">{template.link.replace(/^https?:\/\//, '').substring(0, 30)}</span>
                                    {template.showQrCode && (
                                      <span className="text-[9px] text-neutral-500 ml-1">(QR)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingTemplate(template);
                                  setEditText(template.text || '');
                                  setEditKeyword(template.keyword || '');
                                  setEditLink(template.link || '');
                                  setEditShowQr(template.showQrCode || false);
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
                            </div>
                          )}
                        </div>
                      ))}
                      {broadcastTemplates.length === 0 && (
                        <p className="text-xs text-neutral-500 text-center py-3">No templates yet. Add one above.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Quick Use Mode - Click to use template (fills all fields)
                  <div className="grid grid-cols-1 gap-2">
                    {broadcastTemplates.map((template) => (
                      <button 
                        key={template.id}
                        onClick={() => {
                          setBroadcastText(template.text || '');
                          setBroadcastLink(template.link || '');
                          setShowQrCode(template.showQrCode || false);
                        }}
                        className="text-left px-4 py-3 bg-neutral-800/50 border border-neutral-800 rounded-xl hover:bg-neutral-800 hover:border-neutral-700 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">/{template.keyword || '?'}</span>
                          <span className="text-xs text-neutral-300 truncate flex-1">{template.text || '(link only)'}</span>
                        </div>
                        {template.link && (
                          <div className="flex items-center gap-1 mt-1">
                            <Link className="w-3 h-3 text-violet-400" />
                            <span className="text-[10px] text-violet-400 truncate">{template.link.replace(/^https?:\/\//, '').substring(0, 40)}</span>
                            {template.showQrCode && (
                              <span className="text-[9px] text-neutral-500 ml-1">(QR)</span>
                            )}
                          </div>
                        )}
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
          <TabsContent value="polls" className="absolute inset-0 m-0 p-0 data-[state=active]:flex flex-col">
            <div className="flex-1 flex flex-col overflow-hidden">
              <AdminPollManager streamId={id} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  );
}
