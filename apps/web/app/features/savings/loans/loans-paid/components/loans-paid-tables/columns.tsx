import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import type { LoanPaymentApi } from '../../schemas/loans-paid-api-response';
import { CellAction } from './cell-action';

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  PAYING: 'Pago Cuota',
  CANCELLATION: 'Cancelación',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
};

export const columns: ColumnDef<LoanPaymentApi>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
    cell: ({ getValue }) => getValue() || '-',
    size: 120,
  },
  {
    accessorKey: 'loanCustomReference',
    header: 'Préstamo',
    cell: ({ getValue }) => getValue() || '-',
    size: 110,
  },
  {
    accessorKey: 'associateFullname',
    header: 'Asociado',
    cell: ({ getValue }) => getValue() || '-',
  },
  {
    accessorKey: 'paymentDate',
    header: 'Fecha de Pago',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return value ? new Date(value).toLocaleDateString('es-VE') : '-';
    },
    size: 120,
  },
  {
    accessorKey: 'paymentType',
    header: 'Tipo de Pago',
    cell: ({ getValue }) => PAYMENT_TYPE_LABELS[getValue() as string] || (getValue() as string),
    size: 120,
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return `${Number(value).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`;
    },
    size: 120,
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método',
    cell: ({ getValue }) => PAYMENT_METHOD_LABELS[getValue() as string] || (getValue() as string),
    size: 110,
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Estado',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      if (value === 'CANCELED') {
        return <Badge variant="destructive">Anulado</Badge>;
      }
      if (value === 'DONE') {
        return <Badge variant="default" className="bg-[#2EA640] hover:bg-[#2EA640]/90">Completado</Badge>;
      }
      return <Badge variant="outline">{value || '-'}</Badge>;
    },
    size: 110,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
    size: 80,
  },
];
