import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus, Upload } from 'lucide-react';
import { useState } from 'react';
import { useBankReconciliationFilters } from '../../hooks/use-bank-reconciliation-filters';
import { RECONCILIATION_STATUS_OPTIONS } from '../../schemas/bank-reconciliation-options';
import { BankReconciliationModal } from '../bank-reconciliation-modal';
import { BankReconciliationUploadModal } from '../bank-reconciliation-upload';

const STATUS_FILTER_OPTIONS = Object.entries(RECONCILIATION_STATUS_OPTIONS).map(
  ([value, label]) => ({ value, label }),
);

export default function BankReconciliationTableAction() {
  const [openCreate, setOpenCreate] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const { filters, setFilters } = useBankReconciliationFilters();

  return (
    <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
      <div className="flex items-center gap-3 flex-grow flex-wrap">
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_FILTER_OPTIONS}
          setFilterValue={(v) => setFilters({ status: v, page: 1 })}
          filterValue={filters.status || ''}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setOpenUpload(true)} size="sm" variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Subir Excel
        </Button>
        <Button onClick={() => setOpenCreate(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Conciliación
        </Button>
      </div>

      <BankReconciliationModal open={openCreate} onOpenChange={setOpenCreate} />
      <BankReconciliationUploadModal open={openUpload} onOpenChange={setOpenUpload} />
    </div>
  );
}
