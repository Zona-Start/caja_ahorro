'use client';

import { formatCurrency } from '@/lib/format-utils';
import { Alert, AlertDescription, AlertTitle } from '@repo/shadcn/alert';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  OPERATION_LABELS,
  type PreviewRow,
} from '../../schemas/special-operations.schema';
import { useSpecialOperationWizardStore } from '../../store/special-operation-wizard.store';

function formatAmount(value: number | undefined) {
  return formatCurrency(Number(value ?? 0), 'VES');
}

export function StepPreviewTable() {
  const preview = useSpecialOperationWizardStore((state) => state.preview);
  const operationType = useSpecialOperationWizardStore(
    (state) => state.operationType,
  );
  const back = useSpecialOperationWizardStore((state) => state.back);
  const next = useSpecialOperationWizardStore((state) => state.next);

  if (!preview || !operationType) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay una vista previa disponible.
      </p>
    );
  }

  const errors = preview.rows.filter(
    (row) => row.status === 'ERROR',
  );

  const liquidationColumns = [
    { key: 'haberesPatrono', label: 'Haberes patrono' },
    { key: 'haberesAsociados', label: 'Haberes asociados' },
    { key: 'excedentes', label: 'Excedentes' },
    { key: 'retiros', label: 'Retiros' },
    { key: 'prestamos', label: 'Préstamos' },
    { key: 'creditos', label: 'Créditos' },
    { key: 'saldoFavor', label: 'Saldo a favor' },
    { key: 'montoLiquidar', label: 'Monto a liquidar' },
  ];

  const loanColumns = [
    { key: 'haberesTotales', label: 'Haberes totales' },
    { key: 'capitalPrestamos', label: 'Deuda préstamos' },
    { key: 'capitalCreditos', label: 'Deuda créditos' },
    { key: 'deudaTotal', label: 'Total deuda' },
    { key: 'montoDescontar', label: 'Monto a descontar' },
    { key: 'saldoRestante', label: 'Saldo restante' },
  ];

  const columns =
    operationType === 'LIQUIDATION_VS_INCOME'
      ? liquidationColumns
      : loanColumns;

  const totalFor = (key: string) => Number(preview.totals[key] ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Vista previa</h2>
          <p className="text-sm text-muted-foreground">
            {OPERATION_LABELS[operationType]} · {preview.summary.validRows}{' '}
            asociado(s) listo(s) para procesar.
          </p>
        </div>
        <Badge variant={errors.length ? 'destructive' : 'success'}>
          {errors.length
            ? `${errors.length} error(es)`
            : 'Todo listo para continuar'}
        </Badge>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Corrige los errores antes de continuar</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {errors.map((row) => (
                <li key={row.rowNumber}>
                  Fila {row.rowNumber} · {row.cedula}: {row.error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Fila</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Nombre y apellido</TableHead>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="text-right whitespace-nowrap"
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.rows.map((row) => (
              <PreviewTableRow
                key={`${row.rowNumber}-${row.cedula}`}
                row={row}
                columns={columns}
              />
            ))}
            <TableRow className="bg-muted/40 font-semibold">
              <TableCell colSpan={3}>Totales</TableCell>
              {columns.map((column) => (
                <TableCell key={column.key} className="text-right">
                  {formatAmount(totalFor(column.key))}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={back}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        <Button onClick={next} disabled={errors.length > 0}>
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PreviewTableRow({
  row,
  columns,
}: {
  row: PreviewRow;
  columns: Array<{ key: string; label: string }>;
}) {
  const isError = row.status === 'ERROR';

  return (
    <TableRow className={isError ? 'bg-destructive/5' : undefined}>
      <TableCell>{row.rowNumber}</TableCell>
      <TableCell>{row.cedula}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{row.fullname || '—'}</span>
          {isError && (
            <span className="text-xs text-destructive">{row.error}</span>
          )}
        </div>
      </TableCell>
      {columns.map((column) => (
        <TableCell key={column.key} className="text-right">
          {isError ? '—' : formatAmount(row.display[column.key])}
        </TableCell>
      ))}
    </TableRow>
  );
}
