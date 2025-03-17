'use client';

import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CategoriesTypesModal } from './categories-types-modal';

interface CategoriesTypesHeaderProps {
  title: string;
  description: string;
  nameButton: string;
  group: string; // Add group prop
}

export function CategoriesTypesHeader({
  title,
  description,
  nameButton,
  group,
}: CategoriesTypesHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading title={title} description={description} />
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> {nameButton}
        </Button>
      </div>

      <CategoriesTypesModal open={open} onOpenChange={setOpen} group={group} />
    </>
  );
}
