import { authService } from '@/features/auth/services/auth-service';
import { redirect } from 'react-router';

/**
 * Logout route — invoked as a navigation action.
 *
 * Calls the backend to revoke the session, clears in-memory state,
 * and redirects to /login.
 *
 * Usage from a component:
 *   <Link to="/logout">Log out</Link>
 *   or: navigate('/logout')
 */
export async function clientLoader() {
  await authService.logout();
  return redirect('/login');
}

export default function LogoutPage() {
  // This component should never actually render because
  // the clientLoader always redirects. Just a fallback.
  return null;
}
