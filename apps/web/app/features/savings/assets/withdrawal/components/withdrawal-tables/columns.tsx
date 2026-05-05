import { type ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/utils';
import { type WithdrawalPaymentApi } from '../../schemas/withdrawal-api-response';
import { ESTATUS_TYPES } from '../../schemas/withdrawal-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<WithdrawalPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'withdrawalDate',
    header: 'Fecha Retiro',
  },
  {
    accessorKey: 'withdrawalType',
    header: 'Tipo',
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto',
    cell: ({ row }) => formatCurrency(Number(row.original.requestedAmount), 'VES'),
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula Asociado',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y Apellido',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText = ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

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
          case 'APPROVED':
            return 'warning';
          case 'REJECTED':
          case 'CANCELLED':
            return 'destructive';
          case 'PENDING_DISBURSEMENT_BANK_BATCH':
            return 'outline';
          case 'DISBURSED':
          case 'PROCESSED':
            return 'success';
          default:
            return 'default';
        }
      })();

      return (
        <Badge variant={variant as any}>
          {statusText}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
