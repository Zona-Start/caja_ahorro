'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { differenceInDays, isBefore, startOfToday } from 'date-fns';
import { AccountPayableApi } from '../../schemas';
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

export const pendingColumns: ColumnDef<AccountPayableApi>[] = [
  {
    accessorKey: 'accountsPayableNumber',
    header: 'Número de CxP',
    cell: ({ row }) => (
      <div className={cn('h-full w-full p-2')}>
        {row.getValue('accountsPayableNumber')}
      </div>
    ),
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
    accessorKey: 'dueDate',
    header: 'Fecha de Vencimiento',
    cell: ({ row }) => (
      <div className={cn('h-full w-full p-2')}>
        <DueDateCell dueDate={row.original.dueDate} />
      </div>
    ),
  },
  {
    accessorKey: 'remainingAmount',
    header: 'Monto Pendiente',
    cell: ({ row }) => {
      return (
        <div className={cn('text-right font-medium h-full w-full p-2')}>
          {Number(row.original.remainingAmount).toFixed(2)} Bs.
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

      return (
        <div className={cn('h-full w-full p-2')}>
          <Badge variant="outline">{statusText}</Badge>
        </div>
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
