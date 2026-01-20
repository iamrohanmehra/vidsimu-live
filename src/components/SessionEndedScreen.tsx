import { Link } from 'react-router-dom';
import type { Event } from '@/types';

interface SessionEndedScreenProps {
  event: Event;
}

export function SessionEndedScreen({ event }: SessionEndedScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-neutral-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-neutral-800 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-neutral-500 rounded-full"></span>
          <span className="text-neutral-400 text-sm font-medium">Session Ended</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          {event.title}
        </h1>

        {/* Message */}
        <p className="text-neutral-400 mb-8 text-lg">
          This session has ended. Thank you for attending!
        </p>

        {/* Description if available */}
        {event.description && (
          <p className="text-neutral-500 mb-8">
            {event.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
          <Link
            to="/help"
            className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need Help?
          </Link>
        </div>
      </div>
    </div>
  );
}
