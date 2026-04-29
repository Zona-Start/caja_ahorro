'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { cn } from '@repo/shadcn/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import {
  CREDIT_MODALITY,
  ESTATUS_TYPES,
} from '../../schemas/credits-management-options';
import { CreditManagement } from '../../schemas/credits-management.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CreditManagement>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'creditModality',
    header: 'Modalidad',
    cell: ({ row }) => {
      const modalityKey = row.original
        .creditModality as keyof typeof CREDIT_MODALITY;
      return CREDIT_MODALITY[modalityKey] || row.original.status;
    },
  },
  {
    accessorKey: 'creditTypeName',
    header: 'Tipo de Crédito',
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
          case 'REQUESTED':
            return 'outline';
          case 'APPROVED':
            return 'default';
          case 'IN_PAYMENT':
            return 'warning';
          case 'PAID':
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
