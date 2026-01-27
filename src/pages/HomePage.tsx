import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { ModeToggle } from '@/components/mode-toggle';

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
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10 relative">
      <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
        <ModeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Codekaro Live</CardTitle>
              <CardDescription>
                Enter your class ID to join the session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="classId">Class ID</FieldLabel>
                    <Input
                      id="classId"
                      type="text"
                      placeholder="e.g., ABC123"
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </Field>

                  {error && (
                    <div className="text-sm text-destructive text-center">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
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
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Having trouble?{' '}
            <a href="/help" className="underline underline-offset-4 hover:text-primary">
              Get help
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
