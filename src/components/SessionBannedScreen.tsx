import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function SessionBannedScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 shadow-lg shadow-destructive/5">
          <ShieldX className="h-10 w-10 text-destructive" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
          Access Denied
        </h1>
        
        <p className="text-muted-foreground text-lg max-w-[450px] mx-auto leading-relaxed mb-8">
          You have been blocked from accessing this session. If you believe this is a mistake, please contact support.
        </p>

        <Link to="/help">
          <Button variant="outline" className="gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need Help?
          </Button>
        </Link>
      </div>
    </div>
  );
}
