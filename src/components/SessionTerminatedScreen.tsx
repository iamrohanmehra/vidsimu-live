import { XCircle } from 'lucide-react';
import type { TerminatedSession } from '@/types';

interface SessionTerminatedScreenProps {
  terminationData: TerminatedSession;
}

export function SessionTerminatedScreen({ terminationData }: SessionTerminatedScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-destructive/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 shadow-lg shadow-destructive/5">
          <XCircle className="h-10 w-10 text-destructive" strokeWidth={1.5} />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 bg-linear-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
          Session Ended
        </h1>
        
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 mb-6 shadow-lg">
          <p className="text-lg text-muted-foreground leading-relaxed">
            {terminationData.message}
          </p>
        </div>

        <p className="text-sm text-muted-foreground/60">
          Ended at {terminationData.terminatedAt.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          })}
        </p>
      </div>
    </div>
  );
}
