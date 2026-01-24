import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useMemo } from 'react';

interface UserAvatarProps {
  src?: string;
  name?: string;
  email?: string;
  className?: string;
  fallbackType?: 'ui-avatars' | 'initials';
}

export function UserAvatar({
  src,
  name,
  email,
  className,
  fallbackType = 'ui-avatars',
}: UserAvatarProps) {
  // Determine display name (use email if name is missing)
  const displayName = name || email || 'User';

  // Get initials for standard fallback
  const initials = useMemo(() => {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [displayName]);

  // UI Avatars URL (consistent fallback)
  const uiAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    displayName
  )}&background=8b5cf6&color=fff`;

  return (
    <Avatar className={`rounded-full overflow-hidden ${className}`}>
      <AvatarImage src={src || ''} alt={displayName} className="rounded-full object-cover" />
      <AvatarFallback delayMs={600} className="bg-neutral-800 text-neutral-400 rounded-full flex items-center justify-center overflow-hidden">
        {fallbackType === 'ui-avatars' ? (
          <img
            src={uiAvatarUrl}
            alt={displayName}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          initials
        )}
      </AvatarFallback>
    </Avatar>
  );
}
