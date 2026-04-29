import { AppSidebar } from '@/components/shared/app-sidebar';
import { SiteHeader } from '@/components/shared/site-header';
import { requireAuthenticated } from '@/lib/auth-guards';
import { SidebarInset, SidebarProvider } from '@repo/shadcn/sidebar';
import { Outlet } from 'react-router';

/**
 * Protected dashboard layout.
 * The clientLoader ensures the user is authenticated before rendering.
 * If the in-memory token is gone (F5), the guard transparently restores
 * the session from the httpOnly refresh-token cookie.
 */
export async function clientLoader() {
  await requireAuthenticated();
  return null;
}

export default function DashboardLayout() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 py-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
