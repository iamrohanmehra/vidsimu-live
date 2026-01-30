import { QRCodeSVG } from 'qrcode.react';
import { ExternalLink } from 'lucide-react';

interface BroadcastMessageProps {
  text?: string;
  link?: string;
  showQrCode?: boolean;
  compact?: boolean; // For admin preview
}

export function BroadcastMessage({ 
  text, 
  link, 
  showQrCode = false,
  compact = false 
}: BroadcastMessageProps) {
  const hasText = text && text.trim().length > 0;
  const hasLink = link && link.trim().length > 0;

  // No content to display
  if (!hasText && !hasLink) {
    return null;
  }

  return (
    <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
      {/* Text content */}
      {hasText && (
        <p className={`${compact ? 'text-xs' : 'text-sm'} text-neutral-100 leading-relaxed`}>
          {text}
        </p>
      )}

      {/* Link section */}
      {hasLink && (
        <div className={`flex ${showQrCode && !compact ? 'items-start gap-4' : 'items-center gap-2'}`}>
          {/* QR Code */}
          {showQrCode && (
            <div className={`
              shrink-0 bg-white rounded-lg p-2 shadow-lg
              ${compact ? 'w-16 h-16' : 'w-24 h-24'}
            `}>
              <QRCodeSVG
                value={link!}
                size={compact ? 48 : 80}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          )}
          
          {/* Link display */}
          <div className="flex-1 min-w-0">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                inline-flex items-center gap-1.5 
                ${compact ? 'text-xs' : 'text-sm'}
                text-violet-400 hover:text-violet-300 transition-colors
                underline underline-offset-2 decoration-violet-500/30
              `}
            >
              <ExternalLink className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
              <span className="truncate max-w-[200px]">
                {link.replace(/^https?:\/\//, '').split('/')[0]}
              </span>
            </a>
            {showQrCode && !compact && (
              <p className="text-xs text-neutral-500 mt-1">
                Scan QR code to open link
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
