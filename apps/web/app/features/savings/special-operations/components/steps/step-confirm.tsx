'use client';

import { useToastSystem } from '@/hooks/use-toast-system';
import { formatCurrency } from '@/lib/format-utils';
import { Button } from '@repo/shadcn/button';
import { Label } from '@repo/shadcn/label';
import { Textarea } from '@repo/shadcn/textarea';
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Play,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { useExecuteSpecialOperationMutation } from '../../hooks/use-special-operations';
import { OPERATION_LABELS } from '../../schemas/special-operations.schema';
import { useSpecialOperationWizardStore } from '../../store/special-operation-wizard.store';
import { SpecialOperationSuccessModal } from '../success-modal';

export function StepConfirm() {
  const toast = useToastSystem();
  const [notes, setNotes] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const operationType = useSpecialOperationWizardStore(
    (state) => state.operationType,
  );
  const operationDate = useSpecialOperationWizardStore(
    (state) => state.operationDate,
  );
  const preview = useSpecialOperationWizardStore((state) => state.preview);
  const accountConfig = useSpecialOperationWizardStore(
    (state) => state.accountConfig,
  );
  const result = useSpecialOperationWizardStore((state) => state.result);
  const setResult = useSpecialOperationWizardStore(
    (state) => state.setResult,
  );
  const back = useSpecialOperationWizardStore((state) => state.back);
  const reset = useSpecialOperationWizardStore((state) => state.reset);

  const executeMutation = useExecuteSpecialOperationMutation();

  if (!preview || !operationType) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos suficientes para confirmar la operación.
      </p>
    );
  }

  const validRows = preview.rows.filter((row) => row.status === 'OK');
  const totalOperacion = Number(preview.totals.totalOperacion ?? 0);

  const handleExecute = () => {
    executeMutation.mutate(
      {
        operationType,
        operationDate,
        rows: validRows.map((row) => ({
          cedula: row.cedula,
          date: row.date,
        })),
        accountConfig,
        notes: notes || undefined,
      },
      {
        onSuccess: (response) => {
          setResult(response);
          setSuccessOpen(true);
          toast.success({
            title: 'Operación ejecutada',
            description: `Se procesaron ${response.totalAssociates} asociados. Asiento Nro. ${response.voucherNo}.`,
          });
        },
        onError: (error: any) => {
          toast.error({
            title: 'No se pudo ejecutar la operación',
            description:
              error?.response?.data?.message ??
              'No se procesó ningún asociado. Verifica la configuración e inténtalo nuevamente.',
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Confirmar operación</h2>
        <p className="text-sm text-muted-foreground">
          Revisa el resumen antes de ejecutar. La operación se procesará en
          una sola transacción.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Tipo de operación"
          value={OPERATION_LABELS[operationType]}
        />
        <SummaryCard label="Fecha" value={operationDate} />
        <SummaryCard
          label="Asociados"
          value={String(validRows.length)}
        />
        <SummaryCard
          label="Total operado"
          value={formatCurrency(totalOperacion, 'VES')}
        />
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Esta acción no se puede deshacer
        </div>
        <p className="text-sm text-muted-foreground">
          Se generarán los movimientos de haberes, se cancelarán las deudas
          correspondientes y se creará un único asiento contable con todos los
          asociados.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="special-operation-notes">
          Notas (opcional)
        </Label>
        <Textarea
          id="special-operation-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Motivo o referencia interna de la operación..."
          rows={3}
        />
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={back}
          disabled={executeMutation.isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
        {result ? (
          <Button
            onClick={() => {
              setSuccessOpen(false);
              reset();
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva operación
          </Button>
        ) : (
          <Button
            onClick={handleExecute}
            disabled={
              executeMutation.isPending || validRows.length === 0
            }
          >
            {executeMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Ejecutar operación
          </Button>
        )}
      </div>

      <SpecialOperationSuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        result={result}
        onNewOperation={() => {
          setSuccessOpen(false);
          reset();
        }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
