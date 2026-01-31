import { useState, useCallback, type FormEvent } from 'react';
import { fetchUser, storeUser } from '@/lib/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onVerified: (user: User) => void;
}

export function EmailVerificationModal({ isOpen, onVerified }: EmailVerificationModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await fetchUser(email.trim());
      
      if (!user) {
        setError('User not found. Please check your email and try again.');
        return;
      }

      storeUser(user);
      onVerified(user);
    } catch (err) {
      console.error('Verification error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email, onVerified]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Enter your email to join
            </h1>
            <p className="text-neutral-400 text-[15px] leading-relaxed">
              Enter your registered email address to join the live session. Your 
              account details will be verified automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="h-12 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-neutral-700"
              />
              {error && (
                <p className="text-sm text-red-500 mt-1">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full h-12 bg-neutral-400 hover:bg-neutral-300 text-black font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Join Session'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
