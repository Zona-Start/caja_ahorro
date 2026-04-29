import { useAuthStore } from '@/stores/auth.store';
import { NavUser } from '@/components/shared/nav-user';
import {
  IconDashboard,
  IconInnerShadowTop,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/shadcn/sidebar';
import type { Icon } from '@tabler/icons-react';
import * as React from 'react';
import { Link, useLocation } from 'react-router';

// ── Navigation definition ────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: Icon;
  /** If defined, the item is only visible when the user has this permission. */
  requiresPermission?: { resource: string; action: string };
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: IconDashboard,
  },
  {
    label: 'Perfil',
    href: '/dashboard/profile',
    icon: IconUser,
  },
  {
    label: 'Usuarios',
    href: '/dashboard/users',
    icon: IconUsers,
    requiresPermission: { resource: 'iam:users', action: 'read' },
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const location = useLocation();

  const filteredNav = navItems.filter((item) => {
    if (!item.requiresPermission) return true;
    const { resource, action } = item.requiresPermission;
    return hasPermission(resource, action);
  });

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/dashboard">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Caja de Ahorro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                    tooltip={item.label}
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
