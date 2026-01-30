import { LockOpen, RotateCcw, X } from 'lucide-react';
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

interface ReactivateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  isReactivating: boolean;
}

export function ReactivateSessionModal({
  isOpen,
  onClose,
  onConfirm,
  isReactivating,
}: ReactivateSessionModalProps) {
  
  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <LockOpen className="w-5 h-5 text-emerald-500" />
            </div>
            <AlertDialogTitle className="text-lg">Reactivate Session</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            This will <span className="text-emerald-500 font-medium">remove the termination lock</span> from this session. 
            All viewers will be able to join and watch the stream again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50 my-4">
          <p className="text-xs text-neutral-400 italic">
            "Use this if you are reusing the same session ID for the next day of a multi-day event, or if you terminated the session by mistake."
          </p>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel 
            onClick={onClose}
            className="flex items-center gap-2"
            disabled={isReactivating}
          >
            <X className="w-4 h-4" />
            Cancel
          </AlertDialogCancel>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isReactivating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2"
          >
            {isReactivating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Reactivating...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Reactivate Session
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
