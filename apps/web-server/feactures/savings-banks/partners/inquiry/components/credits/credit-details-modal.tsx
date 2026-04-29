'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/components/ui/button';
import { Label } from '@repo/shadcn/components/ui/label';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
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
import { useCreditDetails } from '../../hooks/use-inquiry-queries';
import {
  CREDIT_SATUS,
  PAYMENT_LOAN_STATUS,
} from '../../schemas/inquiry-options';

interface CreditDetailsModalProps {
  creditId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreditDetailsModal({
  creditId,
  open,
  onOpenChange,
}: CreditDetailsModalProps) {
  const { data, isLoading, isError } = useCreditDetails(creditId, {
    enabled: open,
  });

  const status = data?.credit.status;
  const statusText =
    CREDIT_SATUS[status as keyof typeof CREDIT_SATUS] || status;

  const variant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'REQUESTED':
        return 'default';
      case 'APPROVED':
        return 'secondary';
      case 'DISBURSED':
        return 'warning';
      case 'IN_PAYMENT':
        return 'outline';
      case 'PAID':
        return 'success';
      default:
        return 'default';
    }
  })();

  // variante de color para el badge
  const paymentVariant = (status: keyof typeof PAYMENT_LOAN_STATUS) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PARTIAL':
        return 'warning';
      case 'OVERDUE':
        return 'destructive';
      case 'PENDING':
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle>Detalles del Crédito</DialogTitle>
          <DialogDescription>
            Información referente al crédito
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="px-6 pb-4">
            {isLoading && <DataTableSkeleton columnCount={5} />}
            {isError && <p>Error al cargar los detalles del crédito.</p>}

            {data && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Referencia
                    </Label>
                    <p className="text-md font-semibold">
                      {data.credit.customReference}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Tipo
                    </Label>
                    <div className="mt-1">{data.credit.creditTypeName}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Fecha de Solicitud
                    </Label>
                    <p>
                      {new Date(data.credit.requestDate).toLocaleDateString(
                        'es-VE',
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Estado
                    </Label>
                    <div className="mt-1">
                      <Badge variant={variant}>{statusText}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Cuotas Pendientes
                    </Label>
                    <div className="mt-1">
                      {' '}
                      {data.summary.pendingInstallments}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Cuotas Pagadas
                    </Label>
                    <div className="mt-1">{data.summary.paidInstallments}</div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Monto Solicitado:
                    </Label>
                    <p className="text-lg">
                      {formatCurrency(
                        Number(data.credit.requestedAmount),
                        'VES',
                      )}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Monto a Pagar
                    </Label>
                    <p>
                      {formatCurrency(Number(data.credit.totalPayable), 'VES')}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Total Pagado
                    </Label>
                    <p> {formatCurrency(data.summary.totalPaid, 'VES')}</p>
                  </div>
                </div>

                <div className="border rounded-md">
                  <h3 className="font-semibold p-3 bg-muted">
                    Plan de Amortización
                  </h3>
                  <div className="overflow-auto max-h-[35vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead># Cuota</TableHead>
                          <TableHead>Fecha Venc.</TableHead>
                          <TableHead>Monto Cuota</TableHead>
                          <TableHead>Capital</TableHead>
                          <TableHead>Interés</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Monto Pagado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.amortizationSchedule.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.installmentNumber}</TableCell>
                            <TableCell>
                              {new Date(item.dueDate).toLocaleDateString(
                                'es-VE',
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                Number(item.totalInstallmentAmount),
                                'VES',
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                Number(item.principalAmount),
                                'VES',
                              )}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(
                                Number(item.interestAmount),
                                'VES',
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={paymentVariant(
                                  item.paymentStatus as keyof typeof PAYMENT_LOAN_STATUS,
                                )}
                              >
                                {PAYMENT_LOAN_STATUS[
                                  item.paymentStatus as keyof typeof PAYMENT_LOAN_STATUS
                                ] ?? item.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatCurrency(Number(item.paidAmount), 'VES')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {data.items.length > 0 && (
                  <div className="border rounded-md">
                    <h3 className="font-semibold p-3 bg-muted">
                      Items del Crédito
                    </h3>
                    <div className="overflow-auto max-h-[35vh]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Nombre Item</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Precio</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.itemType === 'PRODUCT'
                                  ? 'Producto'
                                  : 'Servicio'}
                              </TableCell>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                {formatCurrency(
                                  Number(item.agreedSellingPrice),
                                  'VES',
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
