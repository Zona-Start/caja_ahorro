import { useState, useMemo } from 'react';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import { Badge } from '@repo/shadcn/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { Card, CardContent } from '@repo/shadcn/card';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { CheckCheck, Banknote, Loader2 } from 'lucide-react';
import { usePendingPaymentsQuery } from '../hooks/use-supplier-payments-queries';
import { usePendingPaymentsFilters } from '../hooks/use-pending-payments-filters';
import type { PendingPaymentApi } from '../schemas/supplier-payment-api.schema';
import { BulkPaymentModal } from './bulk-payment-modal';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  APPROVED: 'default',
  PARTIALLY_PAID: 'outline',
  PENDING: 'secondary',
  PAID: 'outline',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Aprobada',
  PARTIALLY_PAID: 'Pago Parcial',
  PENDING: 'Pendiente',
  PAID: 'Pagada',
};

export function PendingPaymentsList() {
  const { filters, setFilters } = usePendingPaymentsFilters();
  const { data, isLoading } = usePendingPaymentsQuery(filters);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const items = useMemo(() => data?.data?.filter((i) => i.type === 'ACCOUNTS_PAYABLE') ?? [], [data]);
  const selectedItems = useMemo(
    () => items.filter((i) => selected[i.id]),
    [items, selected],
  );

  const selectedSupplierId = selectedItems[0]?.supplierId;
  const allSameSupplier = selectedItems.every((i) => i.supplierId === selectedSupplierId);

  const totalSelected = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.amount, 0),
    [selectedItems],
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (items.every((i) => selected[i.id])) {
      setSelected({});
    } else {
      setSelected(Object.fromEntries(items.map((i) => [i.id, true])));
    }
  };

  const meta = data?.meta;
  const supplierName = selectedItems[0]?.supplierName;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Card className="border-dashed border-2 max-w-2xl w-full">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <CheckCheck className="h-12 w-12 text-green-500/60" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              No hay cuentas por pagar pendientes
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Todas las cuentas por pagar han sido liquidadas o no hay facturas autorizadas para pago en este momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedItems.length > 1 && (
            <div className="flex gap-3">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Seleccionadas</p>
                  <p className="text-lg font-bold text-green-700">{selectedItems.length} CxP</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Total a Pagar</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(totalSelected, 'VES')}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Button
            variant="default"
            size={selectedItems.length > 0 ? 'lg' : 'default'}
            disabled={selectedItems.length === 0 || !allSameSupplier}
            onClick={() => setShowPaymentModal(true)}
          >
            <Banknote className="mr-2 h-4 w-4" />
            Pagar Seleccionadas ({selectedItems.length})
          </Button>
        </div>

        {selectedItems.length > 0 && !allSameSupplier && (
          <span className="text-sm text-destructive">
            Selecciona solo CxP del mismo proveedor
          </span>
        )}
        {selectedItems.length === 1 && supplierName && (
          <span className="text-sm text-muted-foreground">
            Proveedor: <span className="font-medium">{supplierName}</span> — {formatCurrency(totalSelected, 'VES')}
          </span>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={items.length > 0 && items.every((i) => selected[i.id])}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Vencimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: PendingPaymentApi) => (
              <TableRow key={item.id} className={selected[item.id] ? 'bg-muted/50' : ''}>
                <TableCell>
                  <Checkbox
                    checked={!!selected[item.id]}
                    onCheckedChange={() => toggleSelect(item.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.reference}</TableCell>
                <TableCell>{item.supplierName}</TableCell>
                <TableCell>{formatCurrency(item.amount, 'VES')}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[item.status] || 'secondary'}>
                    {STATUS_LABELS[item.status] || item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {items.length} de {meta.totalCount} registros
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters({ page: filters.page - 1 })}
            >
              Anterior
            </Button>
            <span>
              Pág {filters.page} de {meta.totalPages}
            </span>
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

      <BulkPaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        selectedItems={selectedItems}
        totalAmount={totalSelected}
        supplierId={selectedSupplierId || ''}
      />
    </div>
  );
}
