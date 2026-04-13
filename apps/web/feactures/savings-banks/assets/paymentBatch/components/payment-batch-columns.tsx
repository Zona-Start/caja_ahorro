import { Checkbox } from '@repo/shadcn/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

export interface PaymentBatchApprovedItem {
  id: number;
  associateId: number;
  associateName: string;
  associateCedula: string;
  reference: string;
  amount: string;
  approvalDate: string;
}

export const getPaymentBatchColumns = (
  itemType: 'WITHDRAWAL' | 'LIQUIDATION',
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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'associateName',
    header: 'Asociado',
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.associateName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.associateCedula}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'reference',
    header: 'Referencia',
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ row }) => {
      const amount = parseFloat(row.original.amount);
      const formatted = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'approvalDate',
    header: 'Fecha Aprobación',
    cell: ({ row }) => {
      return (
        <div>{format(new Date(row.original.approvalDate), 'dd/MM/yyyy')}</div>
      );
    },
  },
];
