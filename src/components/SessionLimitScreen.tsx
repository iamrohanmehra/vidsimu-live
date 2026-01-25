import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface SessionLimitScreenProps {
  onRefresh: () => void;
}

export function SessionLimitScreen({ onRefresh }: SessionLimitScreenProps) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/30 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          <span className="text-red-400 text-sm font-medium">Device Limit Reached</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Already streaming on another device
        </h1>

        {/* Message */}
        <p className="text-neutral-400 mb-8 text-lg">
          You can only watch on one device at a time. Please close the stream on your other device and try again.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={onRefresh}
            className="bg-white hover:bg-neutral-200 text-black font-semibold px-6 py-3"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </Button>
          <Link
            to="/help"
            className="inline-flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
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
