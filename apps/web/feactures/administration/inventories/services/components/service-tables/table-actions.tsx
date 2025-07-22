'use client';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { useSuppliersAll } from '../../../../suppliers/hooks/use-query-suppliers';
import ServiceModal from '../service-modal';
import {
  SERVICE_STATUS_OPTIONS,
  useServiceFilters,
} from './use-service-filters';

export default function ServiceTableActions() {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    setSuppliersIdFilter,
    suppliersIdFilter,
    setStatusFilter,
    statusFilter,
  } = useServiceFilters();

  const [open, setOpen] = useState(false);

  const { data: dataSuppliers } = useSuppliersAll();
  const SUPPLIERS_OPTIONS =
    dataSuppliers?.map((supplier) => ({
      value: supplier?.id?.toString() ?? '',
      label: supplier?.name ?? '',
    })) ?? [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por nombre"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="suppliersId"
          title="Proveedor"
          options={SUPPLIERS_OPTIONS}
          setFilterValue={setSuppliersIdFilter}
          filterValue={suppliersIdFilter}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={SERVICE_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
      </Button>
      <ServiceModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
