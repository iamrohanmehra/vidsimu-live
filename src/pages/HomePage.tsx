import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HomePage() {
  const [classId, setClassId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!classId.trim()) {
      setError('Please enter a class ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const batch = await fetchBatch(classId.trim());

      if (!batch) {
        setError('Invalid class ID. Please check and try again.');
        return;
      }

      navigate(`/s/${classId.trim()}`);
    } catch (err) {
      console.error('Error fetching batch:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-black p-6">
      <div className="w-full max-w-lg">
        <div className="flex flex-col gap-8 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Codekaro Live
            </h1>
            <p className="text-neutral-400 text-[15px] leading-relaxed">
              Enter your class ID to join the live session. Your 
              session will be synchronized automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                id="classId"
                type="text"
                placeholder="e.g., ABC123"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                disabled={isLoading}
                required
                className="h-12 bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-neutral-700 text-center"
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
                  Joining...
                </span>
              ) : (
                'Join Class'
              )}
            </Button>
          </form>

          <p className="text-sm text-neutral-500">
            Having trouble?{' '}
            <a href="/help" className="underline underline-offset-4 hover:text-neutral-400 transition-colors">
              Get help
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
