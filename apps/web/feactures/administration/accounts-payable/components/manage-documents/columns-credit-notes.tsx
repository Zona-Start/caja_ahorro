'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { STATUS_TRANSACTIONS } from '../../schemas/manage-documents.options';
import { CreditNote } from '../../schemas/manage-documents.schema';

// TODO: Implement actions
const CellAction = ({ row }: { row: any }) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm">
        Ver
      </Button>
    </div>
  );
};

export const columnsCreditNotes: ColumnDef<CreditNote>[] = [
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
    header: 'Relación (CXP)',
    cell: ({ row }) => {
      return row.original.accountsPayable?.accountsPayableNumber || 'N/A';
    },
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      return (
        <div className=" font-medium">{formatCurrency(amount, 'VES')}</div>
      );
    },
  },
  {
    accessorKey: 'availableAmount',
    header: 'Monto Disponible',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('availableAmount'));
      return <div className="font-medium">{formatCurrency(amount, 'VES')}</div>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Uso',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        STATUS_TRANSACTIONS[status as keyof typeof STATUS_TRANSACTIONS] ||
        status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'ACTIVE':
            return 'default';
          case 'PARTIALLY_APPLIED':
            return 'warning';
          case 'APPLIED':
            return 'success';
          case 'REVERSED':
            return 'destructive';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('h-full w-full')}>
          <Badge
            variant={
              variant as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'success'
                | 'danger'
            }
          >
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction row={row} />,
  },
];
