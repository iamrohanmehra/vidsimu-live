import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { PreviewStreamContainer } from '@/components/PreviewStreamContainer';
import type { Event } from '@/types';

export function PreviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(!!sessionId);
  const [error, setError] = useState<string | null>(!sessionId ? 'Invalid session ID' : null);

  // Load event data
  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const loadEvent = async () => {
      try {
        setIsLoading(true);
        const eventData = await fetchBatch(sessionId);
        
        if (!eventData) {
          setError('Session not found');
          setIsLoading(false);
          return;
        }

        // Check if stream URLs exist
        if (!eventData.url && !eventData.screenUrl) {
          setError('No video URLs found for this session');
          setIsLoading(false);
          return;
        }

        setEvent(eventData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session data');
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [sessionId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Failed to Load Session</h2>
          <p className="text-neutral-400 mb-6">{error || 'Session not found'}</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Check URLs
  const screenUrl = event.screenUrl || '';
  const faceUrl = event.url || '';

  if (!screenUrl && !faceUrl) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Videos Available</h2>
          <p className="text-neutral-400 mb-2">This session doesn't have any video URLs configured.</p>
          <p className="text-neutral-500 text-sm mb-6">Please add video URLs via the external API before testing.</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PreviewStreamContainer
      event={event}
      screenUrl={screenUrl}
      faceUrl={faceUrl}
    />
  );
}
