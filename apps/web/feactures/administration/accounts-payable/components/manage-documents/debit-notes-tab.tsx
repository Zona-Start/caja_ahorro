'use client';

import { Card, CardContent } from '@repo/shadcn/components/ui/card';
import { DataTable } from '@repo/shadcn/components/ui/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import { useState } from 'react';
import { useSupplierTransactionsNoteDebit } from '../../hooks/use-query-manager-documents';
import { columnsDebitNotes } from './columns-debit-notes';

const AuxiliarComponents = ({
  text,
  color,
}: {
  text: string;
  color?: string;
}) => {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className={color ? text : 'text-center mt-6'}>{text}</p>
      </CardContent>
    </Card>
  );
};

export function DebitNotesTab() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useSupplierTransactionsNoteDebit();

  if (isLoading) return <DataTableSkeleton columnCount={4} />;
  if (isError)
    return (
      <AuxiliarComponents
        text="Error al cargar los anticipos."
        color="text-red-500"
      />
    );

  if (!data || data?.data.length === 0)
    return <AuxiliarComponents text="No hay anticipos para mostrar." />;

  return (
    <div className="flex-1 flex flex-col">
      {/* <div className="mb-4">
        <DataTableSearch
          searchKey="search"
          searchQuery={search}
          setSearchQuery={setSearch}
          placeholder="Buscar por referencia..."
        />
      </div> */}
      <DataTable
        columns={columnsDebitNotes}
        data={data?.data ?? []}
        totalItems={data?.data.length ?? 0}
      />
    </div>
  );
}
