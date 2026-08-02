import { useAuthStore } from '@/stores/auth.store';
import { Separator } from '@repo/shadcn/separator';
import { SidebarTrigger } from '@repo/shadcn/sidebar';
import { ModeToggle } from './mode-toggle';

export function SiteHeader() {
  const user = useAuthStore((s) => s.user);
  const tenantName = user?.memberships?.[0]?.tenantName;
  const roleName = user?.memberships?.[0]?.role?.name;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          <h1 className="text-base font-medium">
            {tenantName ?? 'Caja de Ahorro'}
          </h1>

        </div>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
