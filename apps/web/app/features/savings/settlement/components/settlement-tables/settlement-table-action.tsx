import { useState, useCallback } from 'react';
import { Plus, UploadCloud } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { useSettlementFilters } from '../../hooks/use-settlement-filters';
import { SettlementModal } from '../settlement-modal';
import { SettlementBulkModal } from '../settlement-bulk-modal';
import { Input } from '@repo/shadcn/input';
import { ESTATUS_TYPES } from '../../schemas/settlement-options';
import { useAuthStore } from '@/stores/auth.store';

const STATUS_OPTIONS = Object.entries(ESTATUS_TYPES).map(([value, label]) => ({
  value,
  label,
}));

export function SettlementTableAction() {
  const { filters, setFilters } = useSettlementFilters();
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      setFilters({ search: value, page: 1 });
    },
    [setFilters],
  );

  const canCreate = hasPermission('savings:liquidations', 'create');
  const canMassUpload = hasPermission('savings:liquidations', 'mass_upload');

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 grow">
        <Input
          placeholder="Buscar por cédula..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 md:max-w-sm"
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estado"
          options={STATUS_OPTIONS}
          filterValue={filters.status || ''}
          setFilterValue={(v) => setFilters({ status: v })}
        />
      </div>
      <div className="flex gap-2">
        {canMassUpload && (
          <Button
            onClick={() => setBulkOpen(true)}
            size="sm"
            variant="outline"
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Carga Masiva
          </Button>
        )}
        {canCreate && (
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nueva Liquidación
          </Button>
        )}
      </div>

      <SettlementModal open={open} onOpenChange={setOpen} />
      <SettlementBulkModal open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
