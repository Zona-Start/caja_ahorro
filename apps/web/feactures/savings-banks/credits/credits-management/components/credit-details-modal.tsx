'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { CreditManagementDetails } from '../schemas/credit-management-details';
import {
  CREDIT_MODALITY,
  ESTATUS_TYPES,
} from '../schemas/credits-management-options';

interface CreditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit: CreditManagementDetails | null;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-right">{value || 'N/A'}</p>
  </div>
);

export function CreditDetailsModal({
  isOpen,
  onClose,
  credit,
}: CreditDetailsModalProps) {
  if (!credit) return null;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const modalityLabel =
    CREDIT_MODALITY[credit.creditModality as keyof typeof CREDIT_MODALITY] ||
    credit.creditModality;
  const status = credit.status;
  const statusLabel =
    ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

  const statusVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'REQUESTED':
        return 'outline';
      case 'APPROVED':
        return 'default';
      case 'IN_PAYMENT':
        return 'warning';
      case 'PAID':
        return 'success';
      default:
        return 'default';
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Crédito</DialogTitle>
          <DialogDescription>
            Referencia: {credit.customReference || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Asociado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <DetailItem label="Nombre" value={credit.associateFullname} />
              <DetailItem label="Cédula" value={credit.associateCedula} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Crédito</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              <DetailItem
                label="Monto Solicitado"
                value={formatCurrency(Number(credit.requestedAmount), 'VES')}
              />
              <DetailItem
                label="Tipo de Crédito"
                value={credit.creditTypeName}
              />
              <DetailItem label="Modalidad" value={modalityLabel} />
              <DetailItem
                label="Estatus"
                value={
                  <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                }
              />
              <DetailItem
                label="Tasa de Interés Anual"
                value={`${credit.creditTypeInterestRate}%`}
              />
              <DetailItem
                label="Plazo"
                value={`${credit.creditTypeTermUnits} meses`}
              />
              <DetailItem
                label="Fecha de Solicitud"
                value={formatDate(credit.requestDate).toString()}
              />
              <DetailItem
                label="Fecha de Inicio"
                value={formatDate(credit.startDate)}
              />
              <DetailItem
                label="Fecha de Culminación"
                value={formatDate(credit.endDate)}
              />
              <DetailItem
                label="Nro. de Factura"
                value={credit.invoiceNumber}
              />
            </CardContent>
          </Card>

          {/* {(credit.items && credit.items?.length > 0 || credit.products && credit?.products?.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Artículos del Crédito</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">
                        Costo Unitario
                      </TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {credit.products?.map((p, i) => (
                      <TableRow key={`prod-${i}`}>
                        <TableCell>
                          {p.productName || 'Producto de Inventario'}
                        </TableCell>
                        <TableCell className="text-center">
                          {p.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(p.agreedSellingPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(p.quantity * p.agreedSellingPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {credit.items?.map((item, i) => (
                      <TableRow key={`item-${i}`}>
                        <TableCell>{item.itemDescription}</TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.agreedSellingPrice)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            item.quantity * item.agreedSellingPrice,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )} */}

          {credit.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{credit.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
