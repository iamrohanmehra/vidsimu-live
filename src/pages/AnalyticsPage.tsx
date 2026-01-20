import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { useCurrentViewers } from '@/hooks/useCurrentViewers';
import {
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { messagesCollection } from '@/lib/collections';
import type { Event, Message } from '@/types';

export function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { viewerCount, viewers } = useCurrentViewers({
    streamId: id || '',
    enabled: !!id,
  });

  // Count unique chatters
  const uniqueChatters = new Set(messages.map(m => m.email)).size;

  // Load event data
  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      const eventData = await fetchBatch(id);
      setEvent(eventData);
      setIsLoading(false);
    };

    loadEvent();
  }, [id]);

  // Listen for all public messages
  useEffect(() => {
    if (!id) return;

    const q = query(
      messagesCollection,
      where('streamId', '==', id),
      where('messageType', '==', 'public'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
        } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-500">Loading analytics...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-neutral-500">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-200">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-semibold text-lg">{event.title}</h1>
            <p className="text-neutral-500 text-sm">Analytics Dashboard</p>
          </div>
          <Link
            to={`/s/${id}`}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
          >
            View Stream
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="w-full max-w-2xl space-y-12">
          {/* Viewer Count - Large Display */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h2 className="text-9xl font-bold text-white tabular-nums">
                {viewerCount}
              </h2>
              <p className="text-xl text-neutral-400">Active Viewers</p>
            </div>

            {/* Stats Summary */}
            <p className="text-neutral-500 text-sm">
              Currently {viewerCount} {viewerCount === 1 ? 'user is' : 'users are'} actively watching this stream, with {uniqueChatters} sending messages
            </p>
          </div>

          {/* Message Summary */}
          <div className="text-center space-y-4">
            {messages.length === 0 ? (
              <div className="text-neutral-600 text-sm py-8">
                No messages yet
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-neutral-400 text-sm font-medium">
                  Recent Messages ({messages.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto styled-scrollbar">
                  {messages.slice(0, 10).map((msg) => (
                    <div
                      key={msg.id}
                      className="bg-neutral-900/50 rounded-lg p-3 text-left border border-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-white truncate">
                              {msg.name}
                            </span>
                            <span className="text-xs text-neutral-500">
                              {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-300 break-words">
                            {msg.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Viewer List - Collapsible */}
          {viewers.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-center text-neutral-500 text-sm hover:text-neutral-400 transition-colors list-none">
                <span className="inline-flex items-center gap-2">
                  View all viewers ({viewers.length})
                  <svg 
                    className="w-4 h-4 transition-transform group-open:rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                {viewers.map((viewer, idx) => (
                  <div
                    key={idx}
                    className="bg-neutral-900/30 rounded px-3 py-2 text-xs text-neutral-400 truncate border border-neutral-800/50"
                  >
                    {viewer.email || viewer.name || 'Anonymous'}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </main>

      {/* Custom scrollbar styles */}
      <style>{`
        .styled-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .styled-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .styled-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 3px;
        }
        .styled-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #525252;
        }
      `}</style>
    </div>
  );
}
