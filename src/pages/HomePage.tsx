import { useState, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HomePage() {
  const [classId, setClassId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (e: FormEvent) => {
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
        setError('Class not found. Please check the ID and try again.');
        return;
      }

      // Navigate to stream page
      navigate(`/s/${batch.id}`);
    } catch (err) {
      console.error('Error fetching class:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [classId, navigate]);

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-950 via-violet-950/20 to-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Codekaro Live</h1>
          <p className="text-neutral-400">Enter your class ID to join the session</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter Class ID"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              disabled={isLoading}
              className="bg-neutral-800/50 border-neutral-700 text-white text-center text-lg py-6 placeholder:text-amber-50 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold py-6 text-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Joining...
              </span>
            ) : (
              <>
                Join Class
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </Button>
        </form>

        {/* Help link */}
        <p className="mt-8 text-center text-sm text-neutral-500">
          Having trouble?{' '}
          <a href="/help" className="text-violet-400 hover:text-violet-300">
            Get help
          </a>
        </p>
      </div>
    </div>
  );
}
