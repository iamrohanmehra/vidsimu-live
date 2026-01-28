import { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { generateExportFilename, formatDisplayName } from '@/lib/export';

interface ExportSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (exportName: string) => Promise<boolean>;
  isExporting: boolean;
  defaultTitle?: string;
}

export function ExportSessionModal({
  isOpen,
  onClose,
  onExport,
  isExporting,
  defaultTitle = '',
}: ExportSessionModalProps) {
  const [exportName, setExportName] = useState(defaultTitle);
  const [success, setSuccess] = useState(false);

  const previewFilename = exportName.trim() 
    ? generateExportFilename(exportName)
    : 'session-export.json';

  const previewDisplayName = exportName.trim()
    ? formatDisplayName(exportName)
    : '';

  const handleExport = useCallback(async () => {
    if (!exportName.trim()) return;
    
    const result = await onExport(exportName.trim());
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setExportName(defaultTitle);
      }, 1500);
    }
  }, [exportName, onExport, onClose, defaultTitle]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setExportName(defaultTitle);
      setSuccess(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Export Session Data</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a name for this export. The session data will be downloaded as a JSON file.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">Download started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="exportName" className="block text-sm font-medium mb-1.5">
                Export Name
              </label>
              <input
                id="exportName"
                type="text"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
                placeholder="e.g., How To CSS | B-522"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isExporting}
              />
            </div>

            {exportName.trim() && (
              <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                <p className="text-xs text-muted-foreground">Filename:</p>
                <p className="text-sm font-mono break-all">{previewFilename}</p>
                {previewDisplayName && (
                  <>
                    <p className="text-xs text-muted-foreground mt-2">Display name:</p>
                    <p className="text-sm">{previewDisplayName}</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!success && (
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExporting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleExport}
              disabled={!exportName.trim() || isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download JSON
                </>
              )}
            </Button>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
