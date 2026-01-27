import type { Event } from '@/types';
import { CheckCircle2 } from 'lucide-react';

interface SessionEndedScreenProps {
  event: Event;
}

export function SessionEndedScreen({ event }: SessionEndedScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
          <CheckCircle2 className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
          Session Ended
        </h1>
        
        <p className="text-muted-foreground text-lg max-w-[400px] mx-auto leading-relaxed">
          {event.description || "Thank you for attending. The live stream has concluded."}
        </p>
      </div>
    </div>
  );
}
