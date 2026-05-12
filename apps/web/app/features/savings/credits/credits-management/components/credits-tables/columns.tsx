'use client';

import { Badge } from '@repo/shadcn/badge';
import { type ColumnDef } from '@tanstack/react-table';
import { type CreditsAssociate } from '../schemas/credits-management-api-response';
import { ESTATUS_TYPES, CREDIT_MODALITY } from '../schemas/credits-management-options';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CreditsAssociate>[] = [
  {
    accessorKey: 'customReference',
    header: 'Referencia',
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula',
  },
  {
    accessorKey: 'associateFullname',
    header: 'Asociado',
  },
  {
    accessorKey: 'creditTypeName',
    header: 'Tipo de Crédito',
  },
  {
    accessorKey: 'creditModality',
    header: 'Modalidad',
    cell: ({ row }) => {
      const modality = row.original.creditModality;
      return (
        CREDIT_MODALITY[modality as keyof typeof CREDIT_MODALITY] || modality
      );
    },
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto Solicitado',
  },
  {
    accessorKey: 'requestDate',
    header: 'Fecha Solicitud',
  },
  {
    accessorKey: 'startDate',
    header: 'Inicio',
  },
  {
    accessorKey: 'endDate',
    header: 'Fin',
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
        <Badge variant={variant as never}>
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
