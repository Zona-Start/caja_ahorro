import { cn } from '@repo/shadcn/lib/utils';
import type React from 'react';

type IconWrapperProps = {
  children: React.ReactNode;
  color: string;
  className?: string;
};

const colorMap: Record<string, { bg: string; text: string }> = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-500 dark:text-blue-400',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-500 dark:text-purple-400',
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-500 dark:text-green-400',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-500 dark:text-orange-400',
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-500 dark:text-yellow-400',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-500 dark:text-red-400',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-500 dark:text-pink-400',
  },
  cyan: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-500 dark:text-cyan-400',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-500 dark:text-teal-400',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-500 dark:text-emerald-400',
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-500 dark:text-indigo-400',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-500 dark:text-violet-400',
  },
  fuchsia: {
    bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
    text: 'text-fuchsia-500 dark:text-fuchsia-400',
  },
  rose: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-500 dark:text-rose-400',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-500 dark:text-amber-400',
  },
  lime: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-500 dark:text-lime-400',
  },
};

export function IconWrapper({ children, color, className }: IconWrapperProps) {
  const colorStyle = colorMap[color] || colorMap.blue;

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md p-1.5',
        colorStyle?.bg,
        className,
      )}
    >
      <div className={colorStyle?.text}>{children}</div>
    </div>
  );
}
