import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { useQuery } from '@tanstack/react-query';
import { FileText, Calculator, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { accountsPayableKeys } from '../../keys/accounts-payable-keys';
import { accountsPayableService } from '../../services/accounts-payable-service';
import { STATUS_OPTIONS } from '../../schemas/accounts-payable-options';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  PARTIALLY_PAID: 'outline',
  PAID: 'outline',
  CANCELLED: 'destructive',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string;
}

export function AccountsPayableViewModal({ open, onOpenChange, accountId }: Props) {
  const { data: account, isLoading } = useQuery({
    queryKey: accountsPayableKeys.detail(accountId!),
    queryFn: () => accountsPayableService.getById(accountId!),
    enabled: !!accountId && open,
  });

  const statusLabel = account?.status
    ? STATUS_OPTIONS[account.status as keyof typeof STATUS_OPTIONS] || account.status
    : '-';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cuenta por Pagar #{account?.accountsPayableNumber || account?.invoiceNumber || ''}</DialogTitle>
          <DialogDescription>Información completa de la cuenta por pagar.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">Cargando...</div>
        ) : !account ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">No se encontró la cuenta por pagar.</div>
        ) : (
          <div className="space-y-4">
            {/* Información General */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-semibold">Información General</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoRow label="N° CXP" value={account.accountsPayableNumber || '—'} />
                  <InfoRow label="N° Factura" value={account.invoiceNumber} />
                  <InfoRow label="Proveedor" value={account.supplierName} />
                  {account.supplierInvoiceNumber && (
                    <InfoRow label="Factura Asociada" value={account.supplierInvoiceNumber} />
                  )}
                  <InfoRow label="Estado" value={
                    <Badge variant={STATUS_VARIANTS[account.status] || 'secondary'}>
                      {statusLabel}
                    </Badge>
                  } />
                  {account.dueDate && (
                    <InfoRow label="Vencimiento" value={format(new Date(account.dueDate), 'dd/MM/yyyy')} />
                  )}
                  {account.createdAt && (
                    <InfoRow label="Creado" value={format(new Date(account.createdAt), 'dd/MM/yyyy')} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Autorización */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                {account.isAuthorizePayment ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <h3 className="text-sm font-semibold">Autorización de Pago</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Pago autorizado:</span>
                  {account.isAuthorizePayment ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Sí</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Totales */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                <Calculator className="h-5 w-5 text-purple-600" />
                <h3 className="text-sm font-semibold">Totales</h3>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto Original:</span>
                    <span>{formatCurrency(account.originalAmount, 'VES')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monto Pagado:</span>
                    <span>{formatCurrency(account.paidAmount, 'VES')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-semibold">
                    <span>Saldo Pendiente:</span>
                    <span>{formatCurrency(account.remainingAmount, 'VES')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Observaciones */}
            {account.observations && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <h3 className="text-sm font-semibold">Observaciones</h3>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm">{account.observations}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
