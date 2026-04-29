'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/components/ui/button';
import { Label } from '@repo/shadcn/components/ui/label';
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
import { useWithdrawalDetails } from '../../hooks/use-inquiry-queries';
import {
  PAYMENT_METHOD_TYPES,
  WITHDRAWAL_SATUS,
} from '../../schemas/inquiry-options';

interface WithdrawalDetailsModalProps {
  withdrawalId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WithdrawalDetailsModal({
  withdrawalId,
  open,
  onOpenChange,
}: WithdrawalDetailsModalProps) {
  const { data, isLoading, isError } = useWithdrawalDetails(withdrawalId, {
    enabled: open,
  });

  // variante de color para el badge
  const statusVariant = (status: keyof typeof WITHDRAWAL_SATUS) => {
    switch (status) {
      case 'REQUESTED':
        return 'default';
      case 'APPROVED':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      case 'CANCELLED':
        return 'destructive';
      case 'PENDING_DISBURSEMENT_BANK_BATCH':
        return 'outline';
      case 'DISBURSED':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle>Detalles del Retiro</DialogTitle>
          <DialogDescription>Información referente al retiro</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-4">
          {isLoading && <DataTableSkeleton columnCount={5} />}
          {isError && <p>Error al cargar los detalles del retiro.</p>}

          {data && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Referencia
                  </Label>
                  <p className="text-md font-semibold">
                    {data.withdrawal.referenceCode}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tipo
                  </Label>
                  <div className="mt-1">
                    {data.withdrawal.withdrawalTypeName}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Fecha de Solicitud
                  </Label>
                  <p>
                    {new Date(
                      data.withdrawal.withdrawalDate,
                    ).toLocaleDateString('es-VE')}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Estado
                  </Label>
                  <div className="mt-1">
                    <Badge
                      variant={statusVariant(
                        data.withdrawal.status as keyof typeof WITHDRAWAL_SATUS,
                      )}
                    >
                      {WITHDRAWAL_SATUS[
                        data.withdrawal.status as keyof typeof WITHDRAWAL_SATUS
                      ] ?? data.withdrawal.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Método de Pago
                  </Label>
                  <div className="mt-1">
                    {PAYMENT_METHOD_TYPES[
                      data.withdrawal
                        .paymentMethod as keyof typeof PAYMENT_METHOD_TYPES
                    ] ?? 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Monto Solicitado:
                  </Label>
                  <p className="text-lg">
                    {formatCurrency(
                      Number(data.withdrawal.requestedAmount),
                      'VES',
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Gasto Administrativo:
                  </Label>
                  <p className="text-lg">
                    {formatCurrency(
                      Number(data.withdrawal.administrativeFee),
                      'VES',
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Monto Retirado:
                  </Label>
                  <p className="text-lg">
                    {formatCurrency(
                      Number(data.withdrawal.disbursedAmount),
                      'VES',
                    )}
                  </p>
                </div>
              </div>

              {data.items.length > 0 && (
                <div className="border rounded-md">
                  <h3 className="font-semibold p-3 bg-muted">
                    Items del Retiro
                  </h3>
                  <div className="overflow-auto max-h-[35vh]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Acordado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.map((item, index) => (
                          <TableRow key={index}>
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
