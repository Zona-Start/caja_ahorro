import { useAuthStore } from '@/stores/auth.store';
import { redirect } from 'react-router';
import { initializeSession } from '@/lib/api-client';

/**
 * Home route — acts as an entry-point router:
 *
 *  - If the user is already authenticated → /dashboard
 *  - If not, attempt session restore from cookie → if restored → /dashboard
 *  - Otherwise → /login
 */
export async function clientLoader() {
  const { isAuthenticated } = useAuthStore.getState();

  if (isAuthenticated) {
    return redirect('/dashboard');
  }

  // AuthProvider already tried to restore, so if still not authenticated, go to login.
  const { isAuthenticated: restoredAuth } = useAuthStore.getState();
  if (restoredAuth) {
    return redirect('/dashboard');
  }

  return redirect('/login');
}
