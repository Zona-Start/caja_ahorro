'use client';

import {
  NavMain as AccountingMain,
  NavMain as BankMain,
  NavMain as ConfigMain,
  NavMain,
} from '@/components/nav-main';
import {
  AccountingItems,
  BankItems,
  ConfigItems,
  savingBankItems,
} from '@/constants/data';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@repo/shadcn/sidebar';
import { GalleryVerticalEnd } from 'lucide-react';
import * as React from 'react';

export const company = {
  name: 'Caprebicentenario',
  logo: GalleryVerticalEnd,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex gap-2 py-2 text-sidebar-accent-foreground">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <company.logo className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-md leading-tight">
            <span className="truncate font-semibold mt-2">{company.name}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain titleGroup={'Caja Ahorro'} items={savingBankItems} />
        <AccountingMain titleGroup={'Contabilidad'} items={AccountingItems} />
        <BankMain titleGroup={'Banco'} items={BankItems} />
        <ConfigMain titleGroup={'General'} items={ConfigItems} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
