'use client';

import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
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
import { useState } from 'react';
import { useAccountingCycles } from '../../accounting-cycles/hooks/use-query-accounting-cycle';
import { useCloseCycleMutation } from '../hooks/use-accounting-balance-mutation';

interface CloseCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseCycleModal({ open, onOpenChange }: CloseCycleModalProps) {
  const [cycleId, setCycleId] = useState<string>('');
  const [isFiscalYearEnd, setIsFiscalYearEnd] = useState(false);
  const closeCycleMutation = useCloseCycleMutation();

  const { data: cyclesData } = useAccountingCycles();

  const openCycles =
    cyclesData?.data?.filter((cycle) => cycle.status === 'OPEN') || [];

  const selectedCycle = openCycles.find((c) => c.id?.toString() === cycleId);

  const handleSubmit = async () => {
    if (!cycleId) return;

    try {
      await closeCycleMutation.mutateAsync({
        cycleId: parseInt(cycleId),
        payload: { isFiscalYearEnd },
      });
      onOpenChange(false);
      setCycleId('');
      setIsFiscalYearEnd(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCycleId('');
      setIsFiscalYearEnd(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cierre Contable</DialogTitle>
          <DialogDescription>
            Cierra un ciclo contable y congela sus saldos. Esta acción no se
            puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cycle">Ciclo Contable</Label>
            <Select value={cycleId} onValueChange={setCycleId}>
              <SelectTrigger id="cycle">
                <SelectValue placeholder="Selecciona un ciclo" />
              </SelectTrigger>
              <SelectContent>
                {openCycles.length > 0 ? (
                  openCycles.map((cycle) => {
                    // Ajustar la fecha para evitar el problema de zona horaria
                    const startDate = new Date(cycle.startDate);
                    const endDate = new Date(cycle.endDate);

                    // Sumar el offset de la zona horaria para mostrar la fecha correcta
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
                    No hay ciclos abiertos
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fiscalYearEnd"
              checked={isFiscalYearEnd}
              onCheckedChange={(checked) =>
                setIsFiscalYearEnd(checked as boolean)
              }
            />
            <Label
              htmlFor="fiscalYearEnd"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Es cierre de ejercicio fiscal
            </Label>
          </div>

          {isFiscalYearEnd && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                <strong>Advertencia:</strong> Al marcar como cierre fiscal, se
                realizará la refundición de cuentas de ingresos y gastos, y se
                calculará el resultado del ejercicio.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!cycleId || closeCycleMutation.isPending}
          >
            {closeCycleMutation.isPending ? 'Cerrando...' : 'Realizar Cierre'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
