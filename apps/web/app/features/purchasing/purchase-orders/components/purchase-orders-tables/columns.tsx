import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { PurchaseOrder } from '../../schemas/purchase-orders.schema';
import { CellAction } from './cell-action';
import { formatCurrency } from '@/lib/format-utils';

const statusTranslations: Record<string, string> = {
  DRAFT: 'Borrador',
  APPROVED: 'Aprobado',
  INVOICED: 'Facturado',
  CANCELLED: 'Cancelado',
};

const statusVariants: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  DRAFT: 'secondary',
  APPROVED: 'default',
  INVOICED: 'outline',
  CANCELLED: 'destructive',
};

export const columns: ColumnDef<PurchaseOrder>[] = [
  {
    accessorKey: 'id',
    header: '#',
    cell: ({ row }) => <span className="font-mono">{row.original.id}</span>,
  },
  {
    accessorKey: 'supplierId',
    header: 'Proveedor',
    cell: ({ row }) => {
      return <span>{row.original.supplierId}</span>;
    },
  },
  {
    accessorKey: 'orderDate',
    header: 'Fecha Orden',
    cell: ({ row }) => {
      const date = row.original.orderDate;
      if (!date) return '-';
      return (
        <span>
          {date instanceof Date
            ? date.toLocaleDateString('es-VE')
            : String(date)}
        </span>
      );
    },
  },
  {
    accessorKey: 'expectedDeliveryDate',
    header: 'Entrega Esperada',
    cell: ({ row }) => {
      const date = row.original.expectedDeliveryDate;
      if (!date) return '-';
      return (
        <span>
          {date instanceof Date
            ? date.toLocaleDateString('es-VE')
            : String(date)}
        </span>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={statusVariants[status] || 'secondary'}>
          {statusTranslations[status] || status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: 'Total',
    cell: ({ row }) => {
      const amount = Number(row.original.totalAmount);
      const currency = row.original.currencyCode as 'USD' | 'VES';
      return formatCurrency(amount, currency || 'USD');
    },
  },
  {
    accessorKey: 'currencyCode',
    header: 'Moneda',
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
