'use client';

import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useMemo, useState } from 'react';
import { useAccountingCycles } from '../../accounting-cycles/hooks/use-query-accounting-cycle';
import { useOpenCycleMutation } from '../hooks/use-accounting-balance-mutation';
import { usePaginatedAccountingBalances } from '../hooks/use-query-accounting-balance';

interface OpenCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OpenCycleModal({ open, onOpenChange }: OpenCycleModalProps) {
  const [targetCycleId, setTargetCycleId] = useState<string>('');
  const openCycleMutation = useOpenCycleMutation();
  const { data: cyclesData } = useAccountingCycles();

  // Filtrar ciclos que están pendientes de apertura
  const pendingCycles =
    cyclesData?.data?.filter((cycle) => cycle.status === 'PENDING') || [];

  const selectedCycle = pendingCycles.find(
    (c) => c.id?.toString() === targetCycleId,
  );

  // Lógica para encontrar el ciclo anterior (CLOSED)
  const previousCycle = useMemo(() => {
    if (!selectedCycle || !cyclesData?.data) return null;

    const targetStart = new Date(selectedCycle.startDate).getTime();

    const candidates = cyclesData.data.filter((c) => {
      // Debe estar CERRADO
      if (c.status !== 'CLOSED') return false;
      // Debe ser anterior al target
      const cEnd = new Date(c.endDate).getTime();
      return cEnd < targetStart;
    });

    // Ordenar por fecha fin descendente (el más reciente primero)
    candidates.sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    );

    return candidates[0] || null;
  }, [selectedCycle, cyclesData]);

  // Consultar saldos del ciclo anterior (solo metadata para saber cantidad)
  const { data: prevBalanceData, isLoading: isLoadingPrev } =
    usePaginatedAccountingBalances(
      previousCycle?.id
        ? { accountingCycleId: previousCycle.id.toString(), limit: 1 }
        : {},
    );

  const handleSubmit = async () => {
    if (!targetCycleId) return;

    try {
      await openCycleMutation.mutateAsync({
        targetCycleId: parseInt(targetCycleId),
      });
      handleOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTargetCycleId('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apertura Contable</DialogTitle>
          <DialogDescription>
            Selecciona el ciclo pendiente para realizar la apertura y cargar los
            saldos iniciales desde el ciclo anterior.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetCycle">Ciclo a Abrir</Label>
            <Select value={targetCycleId} onValueChange={setTargetCycleId}>
              <SelectTrigger id="targetCycle">
                <SelectValue placeholder="Selecciona un ciclo pendiente" />
              </SelectTrigger>
              <SelectContent>
                {pendingCycles.length > 0 ? (
                  pendingCycles.map((cycle) => {
                    // Ajustar fechas para visualización correcta
                    const startDate = new Date(cycle.startDate);
                    const endDate = new Date(cycle.endDate);
                    const adjustedStartDate = new Date(
                      startDate.valueOf() +
                        startDate.getTimezoneOffset() * 60 * 1000,
                    );
                    const adjustedEndDate = new Date(
                      endDate.valueOf() +
                        endDate.getTimezoneOffset() * 60 * 1000,
                    );

                    return (
                      <SelectItem
                        key={cycle.id}
                        value={cycle.id?.toString() ?? ''}
                      >
                        {adjustedStartDate.toLocaleDateString()} -{' '}
                        {adjustedEndDate.toLocaleDateString()}
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No hay ciclos pendientes
                  </div>
                )}
              </SelectContent>
            </Select>
            {selectedCycle?.description && (
              <p className="text-sm text-muted-foreground">
                {selectedCycle.description}
              </p>
            )}
          </div>

          {/* Resumen del Ciclo Anterior */}
          {targetCycleId && (
            <div className="rounded-md border p-3 text-sm bg-muted/50">
              <h4 className="font-medium mb-2">Resumen de Apertura</h4>
              {previousCycle ? (
                <div className="space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Origen:</span>{' '}
                    {previousCycle.description}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Cierre:</span>{' '}
                    {new Date(previousCycle.endDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Cuentas a Importar:
                    </span>{' '}
                    {isLoadingPrev
                      ? 'Cargando...'
                      : prevBalanceData?.meta?.totalCount || 0}
                  </p>
                </div>
              ) : (
                <p className="text-yellow-600">
                  No se encontró un ciclo anterior cerrado. Esta será una carga
                  inicial (sin arrastre de saldos).
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetCycleId || openCycleMutation.isPending}
          >
            {openCycleMutation.isPending
              ? 'Aperturando...'
              : 'Generar Apertura'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
