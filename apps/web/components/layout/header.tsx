import { Separator } from '@repo/shadcn/separator';
import { SidebarTrigger } from '@repo/shadcn/sidebar';
import { Breadcrumbs } from '../breadcrumbs';
import ThemeToggle from './ThemeToggle/theme-toggle';
import { UserNav } from './user-nav';

export default function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumbs />
      </div>

      <div className="flex items-end gap-2 px-4">
        <div className="hidden md:flex" />
        <UserNav />
        <ThemeToggle />
      </div>
    </header>
  );
}
