'use client';

import { Heading } from '@repo/shadcn/heading';

interface SystemHeaderProps {
  title: string;
  description: string;
}

export function SettingSystemHeader({ title, description }: SystemHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title={title} description={description} />
      </div>
    </>
  );
}
