import { Checkbox } from '@repo/shadcn/checkbox';
import { type ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format-utils';

export interface PaymentBatchApprovedItem {
  id: string;
  associateId?: string;
  associateCedula?: string;
  associateName?: string;
  reference: string | null;
  approvalDate?: string;
  amount: string;
}

export const getApprovedItemColumns = (
  itemType: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION',
): ColumnDef<PaymentBatchApprovedItem>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'associateName',
    header: 'Asociado',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.associateName || '-'}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.associateCedula || ''}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'reference',
    header: 'Referencia',
    cell: ({ row }) => row.original.reference || '-',
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => {
      const amount = parseFloat(row.original.amount || '0');
      return (
        <span className="font-medium">
          {formatCurrency(amount, 'VES')}
        </span>
      );
    },
  },
  {
    accessorKey: 'approvalDate',
    header: 'Fecha Aprobación',
    cell: ({ row }) => {
      if (!row.original.approvalDate) return '-';
      try {
        return format(new Date(row.original.approvalDate), 'dd/MM/yyyy');
      } catch {
        return row.original.approvalDate;
      }
    },
  },
];
