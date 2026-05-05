import { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';

import { useAssociatesFilters } from '../../hooks/use-associates-filters';
import { ESTATUS_TYPES, PAYROLL_TYPE } from '../../schemas/associates-options';
import { AssociatesModal } from '../associates-modal';
import { AssociatesBulkUploadModal } from '../associates-bulk-upload-modal';
import { ExportAssociatesButton } from '../export-bottom';

export const ESTATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

export const PAYROLL_OPTIONS = Object.entries(PAYROLL_TYPE).map(
  ([value, label]) => ({
    value: value.toString(),
    label,
  }),
);

export default function AssociatesTableAction() {
  const { filters, setFilters } = useAssociatesFilters();
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { search, status, payroll } = filters;

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 grow">
        <DataTableSearch
          title="Buscar por nombre o cédula"
          searchKey="q"
          searchQuery={search || ''}
          setSearchQuery={(q) => setFilters({ search: q })}
          setPage={(p) => setFilters({ page: p })}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={ESTATUS_OPTIONS}
          setFilterValue={(v) => setFilters({ status: v })}
          filterValue={status || ''}
        />
        <DataTableFilterBox
          filterKey="payroll"
          title="Por CrediNomina"
          options={PAYROLL_OPTIONS}
          setFilterValue={(v) => setFilters({ payroll: v })}
          filterValue={payroll || ''}
        />
      </div>
      <div className="flex gap-2">
        <ExportAssociatesButton currentFilters={filters} />
        <Button onClick={() => setBulkOpen(true)} size="sm" variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Carga masiva
        </Button>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Agregar socio
        </Button>
      </div>

      <AssociatesModal open={open} onOpenChange={setOpen} />
      <AssociatesBulkUploadModal open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
