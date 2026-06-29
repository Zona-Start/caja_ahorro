import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { formatCurrency } from '@/lib/format-utils';
import {
  PAYMENT_METHOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../schemas/bank-movement-options';
import type { BankMovement } from '../schemas/bank-movement.schema';

interface BankMovementViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: BankMovement | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-muted-foreground mb-3">{children}</h3>;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value || '-'}</span>
    </div>
  );
}

export function BankMovementViewModal({ open, onOpenChange, data }: BankMovementViewModalProps) {
  if (!data) return null;

  const paymentLabel = PAYMENT_METHOD_OPTIONS[data.paymentMethod as keyof typeof PAYMENT_METHOD_OPTIONS] || data.paymentMethod;
  const categoryLabel = CATEGORY_OPTIONS[data.category as keyof typeof CATEGORY_OPTIONS] || data.category;
  const transactionDateStr = data.transactionDate ? new Date(data.transactionDate).toLocaleDateString() : null;
  const valueDateStr = data.valueDate ? new Date(data.valueDate).toLocaleDateString() : null;
  const currency = data.bankCurrencyCode || 'VES';
  const isCredit = data.creditAmount != null && Number(data.creditAmount) > 0;
  const amount = isCredit ? Number(data.creditAmount) : Number(data.debitAmount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Movimiento Bancario</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Datos del Movimiento */}
          <div>
            <SectionTitle>Datos del Movimiento</SectionTitle>
            <div className="rounded-lg border p-4 space-y-1">
              <FieldRow label="Código" value={data.internalCode || '-'} />
              <FieldRow
                label="Cuenta"
                value={
                  data.bankAccountName
                    ? `${data.bankAccountName} - ${data.bankAccountNumber}`
                    : data.bankAccountNumber || data.bankAccountId
                }
              />
              <FieldRow label="Descripción" value={data.description || ''} />
              <FieldRow label="Fecha Transacción" value={transactionDateStr || '-'} />
              <FieldRow label="Fecha Valor" value={valueDateStr || '-'} />
              <FieldRow label="Categoría" value={categoryLabel} />
            </div>
          </div>

          {/* Monto */}
          <div>
            <SectionTitle>Monto</SectionTitle>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex justify-between items-start py-1.5">
                <span className="text-sm text-muted-foreground">Tipo</span>
                <Badge variant={isCredit ? 'success' : 'destructive'}>
                  {isCredit ? 'Crédito (Entrada)' : 'Débito (Salida)'}
                </Badge>
              </div>
              <FieldRow label="Monto" value={amount > 0 ? formatCurrency(amount, currency) : '-'} />
              {data.resultingBalance != null && (
                <FieldRow label="Saldo Resultante" value={formatCurrency(data.resultingBalance, currency)} />
              )}
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <SectionTitle>Método de Pago</SectionTitle>
            <div className="rounded-lg border p-4 space-y-1">
              <FieldRow label="Método" value={paymentLabel} />
              <FieldRow label="Referencia" value={data.bankReference || '-'} />
            </div>
          </div>

          {/* Estado */}
          <div>
            <SectionTitle>Estado</SectionTitle>
            <div className="rounded-lg border p-4 space-y-1">
              <div className="flex justify-between items-start py-1.5">
                <span className="text-sm text-muted-foreground">Conciliación</span>
                <Badge variant={data.reconciliationStatus === 'RECONCILED' ? 'success' : 'secondary'}>
                  {data.reconciliationStatus === 'RECONCILED' ? 'Conciliado' : 'Pendiente'}
                </Badge>
              </div>
              <div className="flex justify-between items-start py-1.5">
                <span className="text-sm text-muted-foreground">Vinculación</span>
                <Badge variant={data.internalLinkStatus === 'LINKED' ? 'success' : 'secondary'}>
                  {data.internalLinkStatus === 'LINKED'
                    ? 'Vinculado'
                    : data.internalLinkStatus === 'UNLINKED'
                      ? 'No Vinculado'
                      : data.internalLinkStatus || '-'}
                </Badge>
              </div>
              {data.note && <FieldRow label="Nota" value={data.note} />}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
