'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useAccountingConfigurationTableFilters } from '../../hooks/use-accounting-configuration-table-filters';
import { AccountingConfigurationModal } from '../accounting-configuration-modal';

export default function AccountingConfigurationTableAction() {
  const [open, setOpen] = useState(false);
  const { searchQuery, setPage, setSearchQuery } =
    useAccountingConfigurationTableFilters();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por tipo de operación"
          searchKey="operationType"
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Agregar Configuración
      </Button>

      <AccountingConfigurationModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
