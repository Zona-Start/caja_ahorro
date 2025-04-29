'use client';

import CategoriesTypesTableAction from '@/feactures/common/category-types/components/categories-tables/categories-table-action';
import { CategoriesTypesHeader } from '@/feactures/common/category-types/components/categories-types-header';
import CategoriesTypesList from '@/feactures/common/category-types/components/categories-types-list';
import { useOptionsStore } from '@/feactures/common/category-types/store/use-options-store';
import { useEffect } from 'react';

interface AssociatedTypeWrapperProps {
  page: number;
  search: string | null;
  pageLimit: number;
  group: string;
  columns: any; // Replace 'any' with your actual columns type
}

export function AssociatedTypeWrapper({
  page,
  search,
  pageLimit,
  group,
  columns,
}: AssociatedTypeWrapperProps) {
  const toggleOptions = useOptionsStore((state) => state.toggleOptions);

  useEffect(() => {
    toggleOptions(false);
  }, [toggleOptions]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <CategoriesTypesHeader
        description="Gestiona los tipos de Asociados en el sistema"
        title="Tipos de Asociados"
      />
      <CategoriesTypesTableAction
        inputTitle="Buscar por nombre"
        nameButton="Agregar Tipo"
        group={group}
      />
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
