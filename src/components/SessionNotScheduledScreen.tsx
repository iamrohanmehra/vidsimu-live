import { CalendarX } from 'lucide-react';



import { cn } from '@/lib/utils';

interface SessionNotScheduledScreenProps {
  className?: string;
}

export function SessionNotScheduledScreen({ className }: SessionNotScheduledScreenProps) {
  return (
    <div className={cn("min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center relative overflow-hidden", className)}>
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
          <CalendarX className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
          Session Not Scheduled
        </h1>
        
        <p className="text-muted-foreground text-lg max-w-[450px] mx-auto leading-relaxed">
          The session has not been scheduled yet.
        </p>
      </div>
    </div>
  );
}
