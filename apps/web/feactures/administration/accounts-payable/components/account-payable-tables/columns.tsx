'use client';

import { Badge } from '@repo/shadcn/badge';
import { ColumnDef } from '@tanstack/react-table';
import { differenceInDays } from 'date-fns';

import { cn } from '@repo/shadcn/lib/utils';
import { AccountPayableSchemaAPI } from '../../schemas';
import { ACCOUNT_PAYABLE_STATUS_TYPES } from '../../schemas/account-payable-options';
import { CellAction } from './cell-action';

const isOverdue = (dueDate: string | null): boolean => {
  if (!dueDate) return false;
  const date = new Date(dueDate);
  const now = new Date();
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return differenceInDays(date, now) < 0;
};

const getRowClass = (row: any) => {
  return isOverdue(row.original.dueDate) ? 'bg-red-50 dark:bg-red-900/10' : '';
};

const DueDateCell = ({ dueDate }: { dueDate: string | null }) => {
  if (!dueDate) return <span>N/A</span>;
  const date = new Date(dueDate);
  const now = new Date();
  // Reset time part to compare dates only
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const daysDifference = differenceInDays(date, now);
  const overdue = daysDifference < 0;

  let text = '';
  let className = '';

  if (overdue) {
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
      <div>{new Date(dueDate).toLocaleDateString()}</div>
      <div className={cn('text-xs', className)}>{text}</div>
    </div>
  );
};

export const columns: ColumnDef<AccountPayableSchemaAPI>[] = [
  {
    accessorKey: 'accountsPayableNumber',
    header: 'Referencia',
    cell: ({ row }) => (
      <div className={cn('p-2 h-full w-full')}>
        {row.original.accountsPayableNumber}
      </div>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: 'Proveedor',
    cell: ({ row }) => (
      <div className={cn('p-2 h-full w-full')}>{row.original.supplierName}</div>
    ),
  },
  {
    accessorKey: 'supplierInvoiceNumber',
    header: 'Relación',
    cell: ({ row }) => (
      <div className={cn('p-2 h-full w-full')}>
        {row.original.supplierInvoiceNumber || 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'dueDate',
    header: 'Vencimiento',
    cell: ({ row }) => (
      <div className={cn('p-2 h-full w-full')}>
        <DueDateCell dueDate={row.original.dueDate} />
      </div>
    ),
  },
  {
    accessorKey: 'originalAmount',
    header: 'Monto Original',
    cell: ({ row }) => (
      <div
        className={cn('p-2 h-full w-full text-right')}
      >{`${Number(row.original.originalAmount).toFixed(2)} Bs.`}</div>
    ),
  },
  {
    accessorKey: 'remainingAmount',
    header: 'Monto Pendiente',
    cell: ({ row }) => (
      <div
        className={cn('p-2 h-full w-full text-right')}
      >{`${Number(row.original.remainingAmount).toFixed(2)} Bs.`}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ACCOUNT_PAYABLE_STATUS_TYPES[
          status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES
        ] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'PAID':
            return 'success';
          case 'EXPIRED':
            return 'destructive';
          case 'IN_PROGRESS':
            return 'warning';
          case 'PENDING':
            return 'secondary';
          case 'CANCELLED':
            return 'outline';
          case 'ADVANCE':
            return 'warning';
          default:
            return 'default';
        }
      })();

      return (
        <div className={cn('p-2 h-full w-full')}>
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
    header: 'Prioridad',
    id: 'priority',
    cell: ({ row }) => {
      return (
        <div className={cn('p-2 h-full w-full')}>
          {isOverdue(row.original.dueDate) ? (
            <Badge variant="destructive">Alta</Badge>
          ) : (
            <Badge variant="secondary">Normal</Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => {
      return <CellAction data={row.original} dataApi={row.original} />;
    },
  },
];
