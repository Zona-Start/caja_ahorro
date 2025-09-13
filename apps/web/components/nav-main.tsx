'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/shadcn/collapsible';
import { cn } from '@repo/shadcn/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@repo/shadcn/sidebar';
import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconWrapper } from './icon-wrapper';
import { Icons } from './icons';

export function NavMain({
  titleGroup,
  items,
}: {
  titleGroup: string;
  items: {
    title: string;
    url: string;
    icon?: keyof typeof Icons;
    colorIcons?: string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: keyof typeof Icons;
    }[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup className="mt-0">
      <SidebarGroupLabel className="text-md">{titleGroup}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon ? Icons[item.icon] : Icons.logo;
          const isActive = pathname === item.url;

          return item?.items && item?.items?.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    // We pass the isActive prop directly
                    isActive={isActive}
                    className={cn(
                      'text-gray-900 dark:text-gray-100',
                      'hover:text-blue-500 dark:hover:text-blue-400',
                    )}
                  >
                    {item.icon && (
                      // Apply size classes directly to the icon.
                      // The wrapper will scale to fit its content.
                      <IconWrapper>
                        <Icon className="w-5 h-5" />
                      </IconWrapper>
                    )}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname === subItem.url}
                        >
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive}
                className={cn(
                  'text-gray-900 dark:text-gray-100',
                  'hover:text-blue-500 dark:hover:text-blue-400',
                )}
              >
                <Link href={item.url}>
                  <IconWrapper>
                    <Icon className="w-5 h-5" />
                  </IconWrapper>
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
