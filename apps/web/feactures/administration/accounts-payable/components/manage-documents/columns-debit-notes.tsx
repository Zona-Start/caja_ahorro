'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { ColumnDef } from '@tanstack/react-table';
import { DebitNote } from '../../schemas/manage-documents.schema';

export const columnsDebitNotes: ColumnDef<DebitNote>[] = [
  {
    accessorKey: 'transactionNumber',
    header: 'Referencia',
  },
  {
    accessorKey: 'supplier.name',
    header: 'Proveedor',
  },
  {
    accessorKey: 'accountsPayable.accountsPayableNumber',
    header: 'Relación (CXP Aplicada)',
  },
  {
    accessorKey: 'amount',
    header: 'Monto Aplicado',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      return <div className="font-medium">{formatCurrency(amount, 'VES')}</div>;
    },
  },
];
