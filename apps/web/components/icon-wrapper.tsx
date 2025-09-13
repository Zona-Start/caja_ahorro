// components/icon-wrapper.tsx
'use client';

import { cn } from '@repo/shadcn/lib/utils';
import type React from 'react';

type IconWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export function IconWrapper({ children, className }: IconWrapperProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md p-1.5',
        'bg-transparent group-hover:bg-blue-100 group-[.isActive]:bg-blue-100',
        'dark:bg-transparent dark:group-hover:bg-blue-900/30 dark:group-[.isActive]:bg-blue-900/30',
        className,
      )}
    >
      {children}
    </div>
  );
}
