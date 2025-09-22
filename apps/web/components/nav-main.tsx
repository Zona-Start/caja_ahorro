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

  // Helper function to check if any child is active
  const isParentActive = (item: any) => {
    if (pathname === item.url && item.url !== '#') return true;
    return (
      item.items?.some((subItem: any) => pathname === subItem.url) || false
    );
  };

  return (
    <SidebarGroup className="mt-0">
      <SidebarGroupLabel className="text-md">{titleGroup}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = item.icon ? Icons[item.icon] : Icons.logo;
          const isActive = isParentActive(item);
          const hasActiveChild =
            item.items?.some((subItem: any) => pathname === subItem.url) ||
            false;

          return item?.items && item?.items?.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || hasActiveChild}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive}
                    className={cn(
                      'group/menu-item',
                      'text-gray-900 dark:text-gray-100',
                      'hover:!text-blue-600 hover:!bg-blue-100',
                      'dark:hover:text-blue-400 dark:hover:bg-blue-950/50',
                      isActive && [
                        '!text-blue-600 !bg-blue-50 !font-medium',
                        'dark:!text-blue-400 dark:!bg-blue-950/50',
                      ],
                    )}
                  >
                    {item.icon && (
                      <IconWrapper isActive={isActive} hasHover={true}>
                        <Icon className="w-5 h-5" />
                      </IconWrapper>
                    )}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => {
                      const isSubItemActive = pathname === subItem.url;
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isSubItemActive}
                            className={cn(
                              'text-gray-700 dark:text-gray-300',
                              'hover:!text-blue-600 hover:!bg-blue-100',
                              'dark:hover:text-blue-400 dark:hover:bg-blue-950/50',
                              isSubItemActive && [
                                '!text-blue-600 !bg-blue-100 !font-medium',
                                'dark:!text-blue-400 dark:!bg-blue-950/50',
                              ],
                            )}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
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
                  'group/menu-item',
                  'text-gray-900 dark:text-gray-100',
                  '!hover:text-blue-600 !hover:bg-blue-50',
                  'dark:hover:text-blue-400 dark:hover:bg-blue-950/50',
                  isActive && [
                    '!text-blue-600 !bg-blue-100 !font-medium',
                    'dark:!text-blue-400 dark:!bg-blue-950/50',
                  ],
                )}
              >
                <Link href={item.url}>
                  <IconWrapper isActive={isActive} hasHover={true}>
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
