// components/icon-wrapper.tsx
'use client';

import { cn } from '@repo/shadcn/lib/utils';
import type React from 'react';

type IconWrapperProps = {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
  hasHover?: boolean;
};

export function IconWrapper({
  children,
  className,
  isActive = false,
  hasHover = false,
}: IconWrapperProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md p-1.5 transition-colors duration-200',
        'bg-transparent',
        // Active states
        isActive && [
          'bg-blue-100 text-blue-600',
          'dark:bg-blue-950/50 dark:text-blue-400',
        ],
        // Hover states (only when hasHover is true)
        hasHover &&
          !isActive && [
            'group-hover/menu-item:bg-blue-50 group-hover/menu-item:text-blue-600',
            'dark:group-hover/menu-item:bg-blue-950/30 dark:group-hover/menu-item:text-blue-400',
          ],
        className,
      )}
    >
      {children}
    </div>
  );
}
