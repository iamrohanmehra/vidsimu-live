import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  title: string;
  streamId: string;
  viewerCount: number;
  messageCount: number;
  isLive?: boolean;
}

export function AdminHeader({
  title,
  streamId,
  viewerCount,
  messageCount,
  isLive = true,
}: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-black border-b border-neutral-800">
      {/* Left: Title and Live Indicator */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-sm text-neutral-500">Admin Dashboard</p>
        </div>
        
        {isLive && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-red-400 text-xs font-semibold uppercase">Live</span>
          </div>
        )}
      </div>

      {/* Center: Metrics */}
      <div className="flex items-center gap-6">
        {/* Viewer Count */}
        <div className="flex items-center gap-2 text-neutral-300">
          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-semibold text-lg">{viewerCount}</span>
          <span className="text-neutral-500 text-sm">viewers</span>
        </div>

        {/* Message Count */}
        <div className="flex items-center gap-2 text-neutral-300">
          <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-semibold text-lg">{messageCount}</span>
          <span className="text-neutral-500 text-sm">messages</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <Link
          to={`/s/${streamId}`}
          target="_blank"
          className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Stream
        </Link>
      </div>
    </header>
  );
}
