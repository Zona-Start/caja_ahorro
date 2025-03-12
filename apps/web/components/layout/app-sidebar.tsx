'use client';

import { NavMain } from '@/components/nav-main';
import { navItems } from '@/constants/data';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@repo/shadcn/sidebar';
import { GalleryVerticalEnd } from 'lucide-react';
import * as React from 'react';

export const company = {
  name: 'Acme Inc',
  logo: GalleryVerticalEnd,
  plan: 'Enterprise',
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex gap-2 py-2 text-sidebar-accent-foreground">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <company.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{company.name}</span>
            <span className="truncate text-xs">{company.plan}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
