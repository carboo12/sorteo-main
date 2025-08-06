
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // We don't want to redirect until the auth state is definitively known.
    if (loading) {
      return; // Still loading, do nothing, show the spinner.
    }

    // Once loading is false, we can make a decision.
    if (user) {
      // If user exists, go to dashboard.
      router.replace('/dashboard');
    } else {
      // If no user, go to login.
      router.replace('/login');
    }
  }, [user, loading, router]);

  // This view is shown while the useEffect logic decides where to redirect.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Cargando...</p>
    </main>
  );
}
