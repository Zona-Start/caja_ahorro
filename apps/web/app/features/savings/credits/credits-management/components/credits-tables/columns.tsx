'use client';

import { Badge } from '@repo/shadcn/badge';
import { type ColumnDef } from '@tanstack/react-table';
import { ESTATUS_TYPES, CREDIT_MODALITY } from '../../schemas/credits-management-options';
import { CellAction } from './cell-action';

export interface CreditTableRow {
  id: string;
  customReference: string | null;
  associateCedula: string | null;
  associateFullname: string | null;
  creditTypeName: string | null;
  creditModality: string;
  requestedAmount: string;
  installmentAmount: string | null;
  requestDate: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  termType: string | null;
  termUnits: number | null;
}

export function createColumns(
  onViewDetails?: (data: CreditTableRow) => void,
): ColumnDef<CreditTableRow>[] {
  {
    accessorKey: 'customReference',
    header: 'Referencia',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.customReference || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'associateCedula',
    header: 'Cédula',
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {row.original.associateCedula || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'associateFullname',
    header: 'Asociado',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.associateFullname || '—'}</span>
    ),
  },
  {
    accessorKey: 'creditTypeName',
    header: 'Tipo de Crédito',
    cell: ({ row }) => (
      <span className="text-xs">{row.original.creditTypeName || '—'}</span>
    ),
  },
  {
    accessorKey: 'creditModality',
    header: 'Modalidad',
    cell: ({ row }) => {
      const modality = row.original.creditModality;
      return (
        <span className="text-xs">
          {CREDIT_MODALITY[modality as keyof typeof CREDIT_MODALITY] || modality}
        </span>
      );
    },
  },
  {
    accessorKey: 'requestedAmount',
    header: 'Monto',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-right block">
        {parseFloat(row.original.requestedAmount || '0').toLocaleString('es', {
          minimumFractionDigits: 2,
        })}{' '}
        Bs
      </span>
    ),
  },
  {
    accessorKey: 'installmentAmount',
    header: 'Cuota',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-right block">
        {row.original.installmentAmount
          ? `${parseFloat(row.original.installmentAmount).toLocaleString('es', { minimumFractionDigits: 2 })} Bs`
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'requestDate',
    header: 'F. Solicitud',
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.requestDate
          ? new Date(row.original.requestDate).toLocaleDateString('es')
          : '—'}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      const statusText =
        ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

      const variantMap: Record<string, string> = {
        REQUESTED: 'bg-yellow-100 text-yellow-800',
        APPROVED: 'bg-blue-100 text-blue-800',
        IN_PAYMENT: 'bg-amber-100 text-amber-800',
        PAID: 'bg-emerald-100 text-emerald-800',
      };

      return (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${variantMap[status] || 'bg-muted text-muted-foreground'}`}
        >
          {statusText}
        </span>
      );
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => (
      <CellAction data={row.original} onViewDetails={onViewDetails} />
    ),
  },
];
}
