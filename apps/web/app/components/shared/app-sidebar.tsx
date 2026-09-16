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
import { navGroups, type NavGroup, type NavItem, type NavScope, type NavSubItem } from '@/constants/navegations';
import { useAuthStore } from '@/stores/auth.store';
import { useBusinessType } from '@/lib/business-type';
import { NavUser } from './nav-user';
import './sidebar-override.css';
import { useTenantStore } from '@/stores/tenant.store';
import { useMemo } from 'react';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const tenant = useTenantStore((s) => s.tenant);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasModule = useAuthStore((s) => s.hasModule);
  const businessType = useBusinessType();
  const location = useLocation();

  const logoUrl = tenant?.logoUrl || '/img/logo.png';
  const name = tenant?.name || 'Zona Start';

  // 0. Resolvemos la visibilidad según el tipo de negocio del tenant.
  //    Si aún no se conoce el tipo, mostramos el menú completo (fallback seguro).
  const scopeAllows = (scope: NavScope = 'all') => {
    if (scope === 'all' || !businessType) return true;
    if (scope === 'commerce') return businessType === 'EMPRESA_COMERCIAL';
    return (
      businessType === 'CAJA_AHORRO' ||
      businessType === 'EMPRESA_CORPORATIVA'
    );
  };

  // 1. Evaluamos permiso y scope heredando el scope del grupo contenedor.
  const canSee = (
    item: NavItem | NavSubItem,
    inheritedScope: NavScope = 'all',
  ) => {
    if (!scopeAllows(item.scope ?? inheritedScope)) return false;
    if (!item.requiresPermission) return true;
    return hasPermission(
      item.requiresPermission.resource,
      item.requiresPermission.action,
    );
  };

  const filterItem = (
    item: NavItem,
    inheritedScope: NavScope = 'all',
  ): NavItem | null => {
    if (!canSee(item, inheritedScope)) return null;

    if (item.items?.length) {
      const visibleChildren = item.items.filter((child) =>
        canSee(child, item.scope ?? inheritedScope),
      );
      if (visibleChildren.length === 0) return null;
      return { ...item, items: visibleChildren };
    }
    return item;
  };

  // 2. Pre-calculamos el árbol de navegación completo
  const visibleGroups = useMemo(() => {
    return navGroups.reduce((acc: NavGroup[], group) => {
      // A. Validar el scope del tipo de negocio
      if (!scopeAllows(group.scope)) {
        return acc;
      }

      // B. Validar que el tenant tenga los módulos activos
      if (group.modules?.length && !group.modules.some((m) => hasModule(m))) {
        return acc;
      }

      // C. Filtrar los items en base a scope y permisos del rol actual
      const validItems = group.items
        .map((item) => filterItem(item, group.scope))
        .filter((item): item is NavItem => item !== null);

      // D. Solo incluir el grupo en la UI si le quedaron items visibles
      if (validItems.length > 0) {
        acc.push({ ...group, items: validItems });
      }

      return acc;
    }, []);
  }, [businessType, hasPermission, hasModule]); // Recalcular si cambia negocio, permisos o módulos

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="p-1.5!">
              <Link to="/dashboard">
                <img src={logoUrl} alt={name} style={{ width: '48px', height: '48px' }} />
                <span className="text-base font-semibold">{name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Iteramos directamente sobre el array ya depurado */}
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
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