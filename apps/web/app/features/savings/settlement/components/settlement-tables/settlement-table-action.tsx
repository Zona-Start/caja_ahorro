import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import { useSettlementFilters } from '../../hooks/use-settlement-filters';
import { SettlementModal } from '../settlement-modal';
import { Input } from '@repo/shadcn/input';

export function SettlementTableAction() {
  const { filters, setFilters } = useSettlementFilters();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      setFilters({ search: value, page: 1 });
    },
    [setFilters],
  );

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-4 grow">
        <Input
          placeholder="Buscar por cédula..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 md:max-w-sm"
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Nueva Liquidación
        </Button>
      </div>

      <SettlementModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
