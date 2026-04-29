'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { SUPPLIER_INVOICE_STATUS_TYPES } from '../schemas/supplier-invoice-options';
import { SupplierInvoice } from '../schemas/supplier-invoice.schema';

interface DetailsProps {
  invoice: SupplierInvoice;
}

export function SupplierInvoiceDetails({ invoice }: DetailsProps) {
  const statusText =
    SUPPLIER_INVOICE_STATUS_TYPES[
      invoice.status as keyof typeof SUPPLIER_INVOICE_STATUS_TYPES
    ] || invoice.status;

  const variant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (invoice.status) {
      case 'DRAFT':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'ACCOUNTED_FOR':
        return 'warning';
      case 'PAID':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  })();

  return (
    <ScrollArea className="h-[70vh] p-4">
      <div className="space-y-6">
        {/* Supplier Info */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Información del Proveedor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Nombre:</strong> {invoice.supplierName}
            </div>
            {/* Add more supplier details if available in the future */}
          </div>
        </div>

        {/* Invoice Info */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Información de la Factura
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>N° Factura:</strong> {invoice.invoiceNumber}
            </div>
            <div>
              <strong>N° Control:</strong> {invoice.controlNumber || 'N/A'}
            </div>
            <div>
              <strong>Estado:</strong>{' '}
              <Badge
                variant={
                  variant as
                    | 'default'
                    | 'destructive'
                    | 'outline'
                    | 'secondary'
                    | 'success'
                    | 'danger'
                }
              >
                {statusText}
              </Badge>
            </div>
            <div>
              <strong>N° Orden Compra:</strong>{' '}
              {invoice.purchaseOrdersNumber || 'Sin OC'}
            </div>
            <div>
              <strong>Fecha Factura:</strong>{' '}
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </div>
            <div>
              <strong>Fecha Vencimiento:</strong>{' '}
              {invoice.dueDate
                ? new Date(invoice.dueDate).toLocaleDateString()
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Items Info */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Artículos de la Factura
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Costo Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {item.unitCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.totalLine.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Financial Summary */}
        <div className="p-4 border rounded-lg bg-muted/40">
          <h3 className="font-semibold text-lg mb-2">Resumen Financiero</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{invoice.subtotal.toFixed(2)} Bs.</span>
            </div>
            <div className="flex justify-between">
              <span>Impuesto (IVA):</span>
              <span>{invoice.taxAmount.toFixed(2)} Bs.</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{invoice.totalAmount.toFixed(2)} Bs.</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
