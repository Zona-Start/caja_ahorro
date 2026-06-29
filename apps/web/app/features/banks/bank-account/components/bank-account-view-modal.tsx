import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { cn } from '@repo/shadcn/lib/utils';
import { formatCurrency } from '@/lib/format-utils';
import { useAccountingAccounts } from '@/features/accounting/accounting-accounts/hooks/use-accounting-accounts-query';
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_CODE_OPTIONS,
} from '../schemas/bank-account-options';
import type { BankAccount } from '../schemas/bank-account.schema';

interface BankAccountViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: BankAccount | null;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
      {children}
    </h3>
  );
}

function FieldRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium text-right max-w-[60%]', mono && 'font-mono')}>
        {value || '-'}
      </span>
    </div>
  );
}

export function BankAccountViewModal({
  open,
  onOpenChange,
  data,
}: BankAccountViewModalProps) {
  if (!data) return null;

  const { data: accountingAccounts } = useAccountingAccounts();

  const chartAccount =
    data.linkedChartAccountId && accountingAccounts
      ? accountingAccounts.find((a) => a.id === data.linkedChartAccountId)
      : null;
  const chartAccountLabel = chartAccount
    ? `${chartAccount.code} - ${chartAccount.name}`
    : null;

  const accountTypeLabel =
    ACCOUNT_TYPE_OPTIONS[
      data.accountType as keyof typeof ACCOUNT_TYPE_OPTIONS
    ] || data.accountType;

  const currencyLabel =
    CURRENCY_CODE_OPTIONS[
      data.currencyCode as keyof typeof CURRENCY_CODE_OPTIONS
    ] || data.currencyCode;

  const openingDateStr = data.openingDate
    ? new Date(data.openingDate).toLocaleDateString()
    : null;

  const lastStatementDateStr = data.lastStatementDate
    ? new Date(data.lastStatementDate).toLocaleDateString()
    : null;

  const createdAtStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString()
    : null;

  const updatedAtStr = data.updatedAt
    ? new Date(data.updatedAt).toLocaleDateString()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Cuenta Bancaria</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sección: Datos Bancarios */}
          <div>
            <SectionTitle>Datos de la Cuenta</SectionTitle>
            <div className="rounded-lg border p-4 space-y-1">
              <FieldRow label="Banco" value={data.bankDirectoryName || data.bankDirectoryId || '-'} />
              <FieldRow label="Número de Cuenta" value={data.accountNumber} mono />
              <FieldRow label="Nombre" value={data.accountName || '-'} />
              <FieldRow label="Tipo de Cuenta" value={accountTypeLabel} />
              <FieldRow label="Moneda" value={currencyLabel} />
              <FieldRow label="Fecha de Apertura" value={openingDateStr || '-'} />
              <div className="flex justify-between items-start py-1.5">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={data.isActive ? 'success' : 'destructive'}>
                  {data.isActive ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Sección: Información Contable */}
          {(data.linkedChartAccountId || data.currentBalance != null) && (
            <div>
              <SectionTitle>Información Contable</SectionTitle>
              <div className="rounded-lg border p-4 space-y-1">
                <FieldRow
                  label="Cuenta Contable"
                  value={chartAccountLabel || data.linkedChartAccountId || '-'}
                />
                <FieldRow
                  label="Saldo Inicial"
                  value={
                    data.currentBalance != null
                      ? formatCurrency(data.currentBalance, data.currencyCode || 'VES')
                      : '-'
                  }
                />
                <div className="flex justify-between items-start py-1.5">
                  <span className="text-sm text-muted-foreground">
                    Asiento de Apertura
                  </span>
                  <Badge variant={data.openingEntryPosted ? 'success' : 'secondary'}>
                    {data.openingEntryPosted ? 'Generado' : 'Pendiente'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Sección: Saldos */}
          <div>
            <SectionTitle>Saldos</SectionTitle>
            <div className="rounded-lg border p-4 space-y-1">
              <FieldRow
                label="Saldo en Libros"
                value={
                  data.currentBalance != null
                    ? formatCurrency(data.currentBalance, data.currencyCode || 'VES')
                    : '-'
                }
              />
              <FieldRow
                label="Saldo Extracto"
                value={
                  data.lastStatementBalance != null
                    ? formatCurrency(data.lastStatementBalance, data.currencyCode || 'VES')
                    : '-'
                }
              />
              <FieldRow
                label="Fecha Extracto"
                value={lastStatementDateStr || '-'}
              />
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            {createdAtStr && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Creado: {createdAtStr}</span>
                {updatedAtStr && <span>Actualizado: {updatedAtStr}</span>}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
