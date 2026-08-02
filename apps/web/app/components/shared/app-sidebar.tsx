import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@repo/shadcn/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@repo/shadcn/collapsible';
import { ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { navGroups } from '@/constants/navegations';
import { useAuthStore } from '@/stores/auth.store';
import { NavUser } from './nav-user';
import './sidebar-override.css';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const location = useLocation();

  // Función para filtrar por permisos (aplica a padres e hijos si es necesario)
  const canSee = (item: any) => {
    if (!item.requiresPermission) return true;
    return hasPermission(item.requiresPermission.resource, item.requiresPermission.action);
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="p-1.5!">
              <Link to="/dashboard">
                <img src="/img/logo_sidebar.png" alt="Logo" className="size-10" />
                <span className="text-base font-semibold">Caja de Ahorro</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.filter(canSee).map((item) => {
                // Si el item NO tiene hijos, renderizamos un link simple
                if (!item.items?.length) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === item.href}
                        tooltip={item.label}
                      >
                        <Link to={item.href}>
                          {item.icon && <item.icon />}
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                // Si TIENE hijos, renderizamos un Collapsible
                return (
                  <Collapsible
                    key={item.label}
                    asChild
                    defaultOpen={item.items?.some((sub) => location.pathname.startsWith(sub.href)) ?? false}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.label}>
                          {item.icon && <item.icon />}
                          <span>{item.label}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === subItem.href}
                              >
                                <Link to={subItem.href}>
                                  <span>{subItem.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}