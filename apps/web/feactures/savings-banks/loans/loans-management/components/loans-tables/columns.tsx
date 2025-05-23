'use client';

import { ColumnDef } from '@tanstack/react-table';

import {
  ESTATUS_TYPES,
  lOAN_MODALITY,
} from '../../schemas/loans-management-options';
import { LoanManagement } from '../../schemas/loans-management.schema';
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
      const modalityKey = row.original
        .loanModality as keyof typeof lOAN_MODALITY;
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
      const statusKey = row.original.status as keyof typeof ESTATUS_TYPES;
      return ESTATUS_TYPES[statusKey] || row.original.status;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
