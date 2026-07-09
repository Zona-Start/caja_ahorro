import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Separator } from '@repo/shadcn/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalDetailsQuery } from '../../hooks/use-inquiry-query';
import {
  PAYMENT_METHOD_TYPES,
  WITHDRAWAL_SATUS,
} from '../../schemas/inquiry-options';

interface WithdrawalItem {
  itemType?: string;
  itemId?: number | string | null;
  itemName?: string | null;
  itemDescription?: string | null;
  quantity?: number;
  agreedSellingPrice?: number | string;
  days?: number;
}

interface WithdrawalDetailsModalProps {
  withdrawalId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawalDetailsModal({
  withdrawalId,
  open,
  onOpenChange,
}: WithdrawalDetailsModalProps) {
  const { data, isLoading, isError } = useWithdrawalDetailsQuery(withdrawalId);

  const statusVariant = (status: keyof typeof WITHDRAWAL_SATUS) => {
    switch (status) {
      case 'REQUESTED':
        return 'default' as const;
      case 'APPROVED':
        return 'outline' as const;
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive' as const;
      case 'PENDING_DISBURSEMENT_BANK_BATCH':
        return 'warning' as const;
      case 'DISBURSED':
        return 'success' as const;
      default:
        return 'default' as const;
    }
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('es-VE');
  };

  const items: WithdrawalItem[] = (() => {
    if (!data?.withdrawal?.withdrawalItems) return [];
    const raw = data.withdrawal.withdrawalItems;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    }
    return [];
  })();

  const hasItems = items.length > 0;
  const isCasaComercial = data?.withdrawal?.isHouseComercial;
  const isInventario = data?.withdrawal?.isInternalInventory;
  const itemsLabel = isCasaComercial
    ? 'Artículos (Casa Comercial)'
    : isInventario
      ? 'Productos (Inventario)'
      : 'Ítems del Retiro';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Retiro</DialogTitle>
          <DialogDescription>
            Información detallada del retiro solicitado.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <DataTableSkeleton columnCount={4} />}

        {isError && (
          <div className="py-6 text-center text-destructive">
            Error al cargar los detalles del retiro.
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Referencia
                </p>
                <p className="font-mono font-semibold">
                  {data.withdrawal.referenceCode || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tipo
                </p>
                <p>{data.withdrawal.withdrawalTypeName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Fecha Solicitud
                </p>
                <p>{formatDate(data.withdrawal.withdrawalDate)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Estado
                </p>
                <Badge
                  variant={
                    statusVariant(
                      data.withdrawal.status as keyof typeof WITHDRAWAL_SATUS,
                    ) as any
                  }
                >
                  {WITHDRAWAL_SATUS[
                    data.withdrawal.status as keyof typeof WITHDRAWAL_SATUS
                  ] ?? data.withdrawal.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Método de Pago
                </p>
                <p>
                  {data.withdrawal.paymentMethod
                    ? PAYMENT_METHOD_TYPES[
                    data.withdrawal
                      .paymentMethod as keyof typeof PAYMENT_METHOD_TYPES
                    ] ?? data.withdrawal.paymentMethod
                    : 'N/A'}
                </p>
              </div>
              {isCasaComercial && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Modalidad
                  </p>
                  <Badge variant="outline">Retiro por Casa Comercial</Badge>
                </div>
              )}
              {isInventario && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Modalidad
                  </p>
                  <Badge variant="secondary">Retiro por Inventario Interno</Badge>
                </div>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Monto Solicitado</p>
                <p className="text-lg font-bold font-mono">
                  {formatCurrency(
                    Number(data.withdrawal.requestedAmount),
                    'VES',
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Gasto Admin.</p>
                <p className="text-lg font-bold font-mono text-amber-600">
                  {formatCurrency(
                    Number(data.withdrawal.administrativeFee || 0),
                    'VES',
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Monto Retirado</p>
                <p className="text-lg font-bold font-mono text-emerald-600">
                  {formatCurrency(
                    Number(data.withdrawal.disbursedAmount || 0),
                    'VES',
                  )}
                </p>
              </div>
            </div>

            {hasItems && (
              <div className="rounded-lg border">
                <div className="bg-muted px-4 py-2 font-semibold text-sm">
                  {itemsLabel}
                </div>
                <div className="overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item / Producto</TableHead>
                        {!isInventario && <TableHead className="w-20 text-center">Cant.</TableHead>}
                        <TableHead className="text-right">Precio</TableHead>
                        {isInventario && <TableHead className="w-20 text-center">Cant.</TableHead>}
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => {
                        const qty = Number(item.quantity || 1);
                        const price = Number(item.agreedSellingPrice || 0);
                        const subtotal = qty * price;
                        const displayName = isCasaComercial
                          ? item.itemDescription || item.itemName || `Ítem #${idx + 1}`
                          : item.itemName || item.itemDescription || `Ítem #${idx + 1}`;
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <p className="font-medium">{displayName}</p>
                              {isCasaComercial && item.itemDescription && item.itemName && (
                                <p className="text-xs text-muted-foreground">
                                  {item.itemName}
                                </p>
                              )}
                              {!isCasaComercial && !isInventario && item.itemType && (
                                <p className="text-xs text-muted-foreground">
                                  {item.itemType}
                                </p>
                              )}
                            </TableCell>
                            {!isInventario && (
                              <TableCell className="text-center">{qty}</TableCell>
                            )}
                            <TableCell className="text-right font-mono text-xs">
                              {formatCurrency(price, 'VES')}
                            </TableCell>
                            {isInventario && (
                              <TableCell className="text-center">{qty}</TableCell>
                            )}
                            <TableCell className="text-right font-mono text-xs font-semibold">
                              {formatCurrency(subtotal, 'VES')}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
