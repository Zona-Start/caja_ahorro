'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@repo/shadcn/badge';
import { cn } from '@repo/shadcn/utils';
import {
  ESTATUS_TYPES,
  lOAN_MODALITY,
} from '../../schemas/loans-management-options';
import { type LoanManagement } from '../../schemas/loans-management.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<LoanManagement>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'loanModality',
    header: 'Modalidad',
    cell: ({ row }) => {
      const modalityKey = row.original.loanModality as keyof typeof lOAN_MODALITY;
      return lOAN_MODALITY[modalityKey] || row.original.status;
    },
  },
  {
    accessorKey: 'loanTypeName',
    header: 'Tipo de Préstamo',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Nombre y Apellido',
  },
  {
    accessorKey: 'startDate',
    header: 'Fecha de Comienzo',
  },
  {
    accessorKey: 'endDate',
    header: 'Fecha de Culminación',
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto Aprobado',
  },
  {
    accessorKey: 'status',
    header: 'Estatus',
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
          case 'REQUESTED': return 'default';
          case 'APPROVED': return 'secondary';
          case 'DISBURSED': return 'warning';
          case 'IN_PAYMENT': return 'outline';
          case 'PAID': return 'success';
          case 'CANCELLED': return 'destructive';
          default: return 'default';
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
