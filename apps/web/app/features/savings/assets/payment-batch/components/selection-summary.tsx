import { Button } from '@repo/shadcn/button';
import { Save } from 'lucide-react';

interface SelectionSummaryProps {
  selectedCount: number;
  totalAmount: number;
  currencyCode: string;
  isSubmitting: boolean;
  onProcess: () => void;
  isEdit?: boolean;
}

export function SelectionSummary({
  selectedCount,
  totalAmount,
  currencyCode,
  isSubmitting,
  onProcess,
  isEdit,
}: SelectionSummaryProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Registros seleccionados
              </span>
              <span className="text-2xl font-bold">{selectedCount}</span>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">
                Monto Total a Desembolsar
              </span>
              <span className="text-2xl font-bold text-primary">
                {totalAmount.toLocaleString('es-VE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {currencyCode}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={onProcess}
            disabled={isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Procesando...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Save className="h-4 w-4" />
                {isEdit ? 'Actualizar Lote' : 'Procesar Lote'}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
