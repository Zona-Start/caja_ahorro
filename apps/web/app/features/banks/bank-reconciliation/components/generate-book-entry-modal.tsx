import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Textarea } from '@repo/shadcn/textarea';
import { formatCurrency, formatDbDate } from '@/lib/format-utils';
import { useGenerateBookEntryMutation } from '../hooks/use-bank-reconciliation-query';

interface Props {
  reconciliationId: string;
  statementLineId: string;
  statementLines: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerateBookEntryModal({ reconciliationId, statementLineId, statementLines, open, onOpenChange }: Props) {
  const line = statementLines.find((l: any) => l.id === statementLineId);
  const mutation = useGenerateBookEntryMutation();

  const [description, setDescription] = useState('');

  if (!line) return null;

  const isCredit = Number(line.creditAmount) > 0;
  const amount = isCredit ? Number(line.creditAmount) : Number(line.debitAmount);

  const handleGenerate = () => {
    mutation.mutate(
      { reconciliationId, payload: { statementLineId, description: description || undefined } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Crear Movimiento en Libros</DialogTitle>
          <DialogDescription>
            Convierte esta línea del extracto en un movimiento bancario y concílialo automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 bg-muted/20">
            <div>
              <Label className="text-xs text-muted-foreground">Fecha</Label>
              <p className="text-sm font-medium">{formatDbDate(line.transactionDate)}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <p className="text-sm font-medium">{isCredit ? 'Crédito (Entrada)' : 'Débito (Salida)'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Monto</Label>
              <p className="text-sm font-bold">{formatCurrency(amount, 'VES')}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Referencia</Label>
              <p className="text-sm">{line.bankReference || '-'}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Concepto Original</Label>
              <p className="text-sm">{line.description}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción para el movimiento contable</Label>
            <Textarea
              placeholder={line.description}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Si no se especifica, se usará el concepto original.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleGenerate} disabled={mutation.isPending}>
              {mutation.isPending ? 'Creando...' : 'Crear Movimiento y Conciliar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
