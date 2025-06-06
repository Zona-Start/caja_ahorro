'use client';

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
