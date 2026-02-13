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
import Image from 'next/image';
import * as React from 'react';

export const company = {
  name: 'CapreBDT',
  logo: GalleryVerticalEnd,
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex gap-2 py-2 text-sidebar-accent-foreground">
          <div className="flex aspect-square size-11 items-center justify-center rounded-lg  text-sidebar-primary-foreground">
            <Image
              src="/logo_sidebar.png"
              alt="logo"
              width={64}
              height={64}
              priority
            />
          </div>
          <div className="grid flex-1 text-left text-md leading-tight">
            <span className="truncate font-semibold mt-2">{company.name}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain titleGroup={'Gestión Caja Ahorro'} items={savingBankItems} />
        <AccountingMain
          titleGroup={'Gestión Contable'}
          items={AccountingItems}
        />
        <BankMain titleGroup={'Gestón Bancaria'} items={BankItems} />
        <ConfigMain titleGroup={'Utilidades'} items={ConfigItems} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
