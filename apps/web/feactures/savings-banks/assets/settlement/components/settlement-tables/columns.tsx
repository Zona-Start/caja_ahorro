'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { SettlementPaymentApi } from '../../schemas/settlement-api-response';
import { ESTATUS_TYPES } from '../../schemas/settlement-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SettlementPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y apellido asociado',
  },
  {
    accessorKey: 'netLiquidationAmount',
    header: 'Monto Liquidado',
  },
  {
    accessorKey: 'liquidationDate',
    header: 'Fecha Liquidación',
  },

  {
    accessorKey: 'totalSavingsBalanceAtLiquidation',
    header: 'Haberes Totales',
  },
  {
    accessorKey: 'totalOutstandingLoansAtLiquidation',
    header: 'Préstamos Pendientes',
  },
  {
    accessorKey: 'totalOutstandingCreditsAtLiquidation',
    header: 'Créditos Pendientes',
  },

  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

      const variant:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'success'
        | 'warning' = (() => {
        switch (status) {
          case 'REQUESTED':
            return 'default';
          case 'PROCESSED':
            return 'warning';
          case 'REJECTED':
            return 'destructive';
          case 'CANCELLED':
            return 'destructive';
          case 'PENDING_DISBURSEMENT_BANK_BATCH':
            return 'outline';
          case 'DISBURSED':
            return 'success';
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
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
