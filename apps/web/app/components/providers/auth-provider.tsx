import { initializeSession, setAuthHeader } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useEffect, useState, type ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider — wraps the app and handles session restoration on mount.
 *
 * On initial load (or page refresh / F5), this component:
 * 1. Attempts to restore the session via the httpOnly refresh-token cookie.
 * 2. If successful, populates the in-memory store with user + access token.
 * 3. If failed, marks the session as "not authenticated" (user sees login).
 *
 * While restoring, a loading spinner is shown to prevent UI flash.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const isInitializing = useAuthStore((s) => s.isInitializing);

  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const success = await initializeSession();
        if (!success && !cancelled) {
          // No valid refresh token — make sure state is clean.
          useAuthStore.getState().logout();
          setAuthHeader(null);
        }
      } catch {
        if (!cancelled) {
          useAuthStore.getState().logout();
          setAuthHeader(null);
        }
      } finally {
        if (!cancelled) {
          useAuthStore.getState().setInitialized();
          setIsReady(true);
        }
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isReady || isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
