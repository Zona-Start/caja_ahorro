'use client';

import CategoriesTypesTableAction from '@/feactures/common/category-types/components/categories-tables/categories-table-action';
import { CategoriesTypesHeader } from '@/feactures/common/category-types/components/categories-types-header';
import CategoriesTypesList from '@/feactures/common/category-types/components/categories-types-list';
import { useOptionsStore } from '@/feactures/common/category-types/store/use-options-store';
import { useEffect } from 'react';

interface AssociadtedTypeWrapperProps {
  page: number;
  search: string | null;
  pageLimit: number;
  group: string;
  columns: any; // Replace 'any' with your actual columns type
}

export function AssociadtedTypeWrapper({
  page,
  search,
  pageLimit,
  group,
  columns,
}: AssociadtedTypeWrapperProps) {
  const toggleOptions = useOptionsStore((state) => state.toggleOptions);

  useEffect(() => {
    toggleOptions(false);
  }, [toggleOptions]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <CategoriesTypesHeader
        description="Gestiona los tipos de asociados en el sistema"
        title="Tipos de Asociados"
        nameButton="Agregar Tipo"
        group={group}
      />
      <CategoriesTypesTableAction />
      <CategoriesTypesList
        initialPage={page}
        initialSearch={search}
        initialLimit={pageLimit}
        initialGroup={group}
        columns={columns}
      />
    </div>
  );
}
