import { navGroups } from '@/constants/navegations';
import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';
import { Separator } from '@repo/shadcn/separator';
import { SidebarTrigger } from '@repo/shadcn/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@repo/shadcn/breadcrumb';
import { ModeToggle } from './mode-toggle';

type Crumb = { label: string; href?: string };

function buildBreadcrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Inicio', href: '/dashboard' }];

  if (pathname === '/dashboard') return crumbs;

  for (const group of navGroups) {
    for (const item of group.items) {
      const itemHref = item.href?.split('?')[0];

      if (itemHref === pathname) {
        crumbs.push({ label: group.label });
        crumbs.push({ label: item.label });
        return crumbs;
      }

      if (item.items?.length) {
        const subItem = item.items.find(
          (sub) => sub.href.split('?')[0] === pathname,
        );
        if (subItem) {
          crumbs.push({ label: group.label });
          if (item.href && item.href !== '#') {
            crumbs.push({ label: item.label, href: itemHref });
          } else {
            crumbs.push({ label: item.label });
          }
          crumbs.push({ label: subItem.label });
          return crumbs;
        }
      }
    }
  }

  return crumbs;
}

export function SiteHeader() {
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : crumb.href ? (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
