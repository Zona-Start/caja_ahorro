import { useState } from 'react';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Plus } from 'lucide-react';
import { useCurrenciesQuery } from '../hooks/use-currencies-queries';
import { currenciesColumns } from './tables/currencies-columns';
import { CurrenciesModal } from './currencies-modal';
import { CurrenciesHeader } from './currencies-header';

export default function CurrenciesList() {
  const { data, isLoading } = useCurrenciesQuery();
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState('');

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} />;
  }

  const currenciesData = data || [];
  const filteredData = search
    ? currenciesData.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.symbol.toLowerCase().includes(search.toLowerCase())
      )
    : currenciesData;

  return (
    <div className="space-y-4">
      <CurrenciesHeader count={currenciesData.length} />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Buscar monedas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-[250px]"
        />

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Moneda
        </Button>
      </div>

      <DataTable
        columns={currenciesColumns}
        data={filteredData}
        totalItems={filteredData.length}
        pageSizeOptions={[10, 20, 50]}
      />

      <CurrenciesModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}