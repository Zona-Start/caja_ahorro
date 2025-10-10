'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { differenceInDays, isBefore, startOfToday } from 'date-fns';
import { TYPE_PAYMENTS } from '../../schemas';
import { SupplierPaymentRow } from '../../types/table';
import { CellAction } from './cell-action';

const DueDateCell = ({ dueDate }: { dueDate: string | Date }) => {
  const date = new Date(dueDate);
  const now = startOfToday();
  const daysDifference = differenceInDays(date, now);
  const isOverdue = isBefore(date, now);

  let text = '';
  let className = '';

  if (isOverdue) {
    text = `Vencida hace ${Math.abs(daysDifference)} días`;
    className = 'text-red-500';
  } else if (daysDifference === 0) {
    text = 'Vence hoy';
    className = 'text-yellow-500';
  } else {
    text = `Vence en ${daysDifference} días`;
    className = 'text-gray-500';
  }

  return (
    <div>
      <div>{dueDate ? date.toLocaleDateString() : 'N/A'}</div>
      {dueDate && (
        <div className={cn('text-xs font-medium', className)}>{text}</div>
      )}
    </div>
  );
};

const getRowClass = (row: any) => {
  const date = new Date(row.original.dueDate);
  const isOverdue = isBefore(date, startOfToday());
  return isOverdue ? 'bg-red-50 dark:bg-red-900/10' : '';
};

export const pendingColumns: ColumnDef<SupplierPaymentRow>[] = [
  {
    accessorKey: 'reference',
    header: 'Número de Referencia',
    cell: ({ row }) => (
      <div className={cn('h-full w-full p-2')}>{row.getValue('reference')}</div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => {
      const paymentType = row.original.type;
      const paymenText =
        TYPE_PAYMENTS[paymentType as keyof typeof TYPE_PAYMENTS] || paymentType;

      return paymenText;
    },
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
    cell: ({ row }) => (
      <div className={cn('h-full w-full p-2')}>
        {row.getValue('supplierName')}
      </div>
    ),
  },
  {
    accessorKey: 'date',
    header: 'Fecha de Vencimiento',
    cell: ({ row }) => (
      <div className={cn('h-full w-full p-2')}>
        <DueDateCell dueDate={row.original.date} />
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Monto Pendiente',
    cell: ({ row }) => {
      return (
        <div className={cn(' font-medium h-full w-full p-2')}>
          {formatCurrency(Number(row.original.amount), 'VES')}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText = status === 'EXPIRED' ? 'Vencida' : 'Pendiente';

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'EXPIRED':
            return 'destructive';
          default:
            return 'secondary';
        }
      })();

      return (
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
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <div className={cn('h-full w-full p-2')}>
        <CellAction data={row.original} tab="pending" />
      </div>
    ),
  },
];
