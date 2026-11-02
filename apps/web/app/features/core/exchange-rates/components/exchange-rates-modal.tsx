import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { ExchangeRatesForm } from './exchange-rates-form';

interface ExchangeRatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExchangeRatesModal({
  open,
  onOpenChange,
}: ExchangeRatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Cargar tasa manual</DialogTitle>
          <DialogDescription>
            Registra la tasa de una moneda para una fecha. Si ya existe una tasa
            para esa moneda y fecha, será reemplazada.
          </DialogDescription>
        </DialogHeader>

        <ExchangeRatesForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
