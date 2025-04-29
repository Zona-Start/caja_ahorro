'use client';

import { Heading } from '@repo/shadcn/heading';

interface CategoriesTypesHeaderProps {
  title: string;
  description: string;
}

export function CategoriesTypesHeader({
  title,
  description,
}: CategoriesTypesHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title={title} description={description} />
      </div>
    </>
  );
}
