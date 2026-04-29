'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CategoriesTypesModal } from '../categories-types-modal';
import { useCategoriesTypesTableFilters } from './use-categories-table-filters';

export default function CategoriesTypesTableAction({
  inputTitle,
  nameButton,
  group,
}: {
  inputTitle: string;
  nameButton: string;
  group: string; // Add group prop
}) {
  const { searchQuery, setPage, setSearchQuery } =
    useCategoriesTypesTableFilters();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title={inputTitle}
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className=" h-4 w-4" /> {nameButton}
      </Button>
      <CategoriesTypesModal open={open} onOpenChange={setOpen} group={group} />
    </div>
  );
}
