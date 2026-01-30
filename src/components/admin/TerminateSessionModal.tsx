import { useState } from 'react';
import { AlertTriangle, Power, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface TerminateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (message: string) => Promise<void>;
  isTerminating: boolean;
}

export function TerminateSessionModal({
  isOpen,
  onClose,
  onConfirm,
  isTerminating,
}: TerminateSessionModalProps) {
  const [message, setMessage] = useState('');

  const handleConfirm = async () => {
    if (!message.trim()) return;
    await onConfirm(message);
    setMessage('');
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-full bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg">Terminate Session</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            This will <span className="text-destructive font-medium">immediately end the session</span> for all viewers. 
            They will see your custom message on a session ended screen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3 my-4">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Termination Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message that will be shown to all viewers..."
            className="w-full h-24 bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-foreground placeholder-neutral-500 focus:border-destructive/50 focus:ring-1 focus:ring-destructive/20 transition-all outline-none resize-none"
            autoFocus
          />
          <p className="text-[10px] text-neutral-500">
            Example: "The session has ended early. Thank you for attending!"
          </p>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={onClose}
            className="flex items-center gap-2"
            disabled={isTerminating}
          >
            <X className="w-4 h-4" />
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!message.trim() || isTerminating}
            className="flex items-center gap-2"
          >
            {isTerminating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Terminating...
              </>
            ) : (
              <>
                <Power className="w-4 h-4" />
                Terminate Session
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
