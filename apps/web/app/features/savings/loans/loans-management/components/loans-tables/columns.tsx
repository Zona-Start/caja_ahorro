'use client';

import { type ColumnDef } from '@tanstack/react-table';
import {
  ESTATUS_TYPES,
  lOAN_MODALITY,
} from '../../schemas/loans-management-options';
import { CellAction } from './cell-action';

export interface LoanTableRow {
  id: string;
  customReference: string | null;
  associateCedula: string | null;
  associateFullname: string | null;
  loanTypeName: string | null;
  loanModality: string;
  requestedAmount: string;
  installmentAmount: string | null;
  requestDate: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  termType: string | null;
  termUnits: number | null;
  interestRate?: string | null;
  totalInterest?: string | null;
  totalPayable?: string | null;
  expensesAmount?: string | null;
  notes?: string | null;
  disbursedAmount?: string | null;
  approvedAmount?: string | null;
  associateAccountNumber?: string | null;
}

export function createLoanColumns(
  onViewDetails?: (data: LoanTableRow) => void,
): ColumnDef<LoanTableRow>[] {
  return [
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
        <span className="text-xs">
          {row.original.associateFullname || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'loanTypeName',
      header: 'Tipo de Préstamo',
      cell: ({ row }) => (
        <span className="text-xs">{row.original.loanTypeName || '—'}</span>
      ),
    },
    {
      accessorKey: 'loanModality',
      header: 'Modalidad',
      cell: ({ row }) => {
        const modality = row.original.loanModality;
        return (
          <span className="text-xs">
            {lOAN_MODALITY[modality as keyof typeof lOAN_MODALITY] || modality}
          </span>
        );
      },
    },
    {
      accessorKey: 'requestedAmount',
      header: 'Monto',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-right block">
          {parseFloat(row.original.requestedAmount || '0').toLocaleString(
            'es',
            { minimumFractionDigits: 2 },
          )}{' '}
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
          DISBURSED: 'bg-amber-100 text-amber-800',
          IN_PAYMENT: 'bg-purple-100 text-purple-800',
          PAID: 'bg-emerald-100 text-emerald-800',
          CANCELLED: 'bg-destructive/20 text-destructive',
          REJECTED: 'bg-destructive/20 text-destructive',
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
