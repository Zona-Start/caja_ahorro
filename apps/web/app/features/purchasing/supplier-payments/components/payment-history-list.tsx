import { useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { Input } from '@repo/shadcn/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Label } from '@repo/shadcn/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, RotateCcw, Loader2 } from 'lucide-react';
import { usePaymentHistoryQuery } from '../hooks/use-supplier-payments-queries';
import { useReversePaymentMutation } from '../hooks/use-supplier-payments-mutations';
import { useSupplierPaymentsFilters } from '../hooks/use-supplier-payments-filters';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { PAYMENT_METHOD_LABELS } from '../schemas/supplier-payment-options';
import type { SupplierPaymentApi } from '../schemas/supplier-payment-api.schema';
import { AlertModal } from '@/components/shared/alert-modal';
import { PaymentViewModal } from './payment-view-modal';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PROCESSED: 'default',
  DRAFT: 'secondary',
  REVERSED: 'destructive',
  PENDING: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  PROCESSED: 'Procesado',
  DRAFT: 'Borrador',
  REVERSED: 'Reversado',
  PENDING: 'Pendiente',
};

export function PaymentHistoryList() {
  const { filters, setFilters } = useSupplierPaymentsFilters();
  const { data, isLoading } = usePaymentHistoryQuery(filters);
  const { mutateAsync: reversePayment, isPending: isReversing } = useReversePaymentMutation();
  const { data: suppliersData } = useSuppliersAllQuery();

  const [voidOpen, setVoidOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [viewPayment, setViewPayment] = useState<SupplierPaymentApi | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const payments = data?.data ?? [];
  const meta = data?.meta;
  const suppliers = suppliersData ?? [];

  const handleVoid = async () => {
    if (!selectedPaymentId) return;
    await reversePayment({ paymentIds: [selectedPaymentId] });
    setVoidOpen(false);
    setSelectedPaymentId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AlertModal
        isOpen={voidOpen}
        onClose={() => { setVoidOpen(false); setSelectedPaymentId(null); }}
        onConfirm={handleVoid}
        loading={isReversing}
        title="¿Anular este pago?"
        description="Se reversará el pago y las cuentas por pagar asociadas volverán a estado pendiente."
      />

      <PaymentViewModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        payment={viewPayment}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Estado:</Label>
          <Select
            value={filters.status || 'all'}
            onValueChange={(v) => setFilters({ status: v === 'all' ? undefined : v, page: 1 })}
          >
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PROCESSED">Procesado</SelectItem>
              <SelectItem value="DRAFT">Borrador</SelectItem>
              <SelectItem value="REVERSED">Reversado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Proveedor:</Label>
          <Select
            value={filters.supplierIds?.[0] || 'all'}
            onValueChange={(v) => setFilters({ supplierIds: v === 'all' ? undefined : [v], page: 1 })}
          >
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {suppliers.map((s: { id: string; name: string }) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Desde:</Label>
          <Input
            type="date"
            className="w-36 h-8 text-xs"
            value={filters.startDate || ''}
            onChange={(e) => setFilters({ startDate: e.target.value || undefined, page: 1 })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Hasta:</Label>
          <Input
            type="date"
            className="w-36 h-8 text-xs"
            value={filters.endDate || ''}
            onChange={(e) => setFilters({ endDate: e.target.value || undefined, page: 1 })}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Pago</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment: SupplierPaymentApi) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.paymentNumber}</TableCell>
                  <TableCell>
                    {(payment.lines || []).some((l) => l.accountsPayableId) ? (
                      <Badge variant="default">Cuenta por Pagar</Badge>
                    ) : (payment.lines || []).some((l) => l.relatedAdvanceId) ? (
                      <Badge variant="secondary">Anticipo</Badge>
                    ) : (
                      <Badge variant="outline">N/D</Badge>
                    )}
                  </TableCell>
                  <TableCell>{payment.supplierName}</TableCell>
                  <TableCell>{formatCurrency(payment.totalAmount, 'VES')}</TableCell>
                  <TableCell>
                    {PAYMENT_METHOD_LABELS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || payment.paymentMethod}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[payment.status] || 'secondary'}>
                      {STATUS_LABELS[payment.status] || payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.processedAt
                      ? format(new Date(payment.processedAt), 'dd/MM/yyyy')
                      : payment.requestedAt
                        ? format(new Date(payment.requestedAt), 'dd/MM/yyyy')
                        : '-'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setViewPayment(payment);
                            setViewOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </DropdownMenuItem>
                        {payment.status === 'PROCESSED' && (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => {
                              setSelectedPaymentId(payment.id);
                              setVoidOpen(true);
                            }}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Anular
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando {payments.length} de {meta.totalCount} registros</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ page: filters.page - 1 })}
            >
              Anterior
            </Button>
            <span>Pág {filters.page} de {meta.totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= meta.totalPages}
              onClick={() => setFilters({ page: filters.page + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
