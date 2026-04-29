'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Button } from '@repo/shadcn/components/ui/button';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import { ESTATUS_TYPES, PurchaseOrderSchemaAPI } from '../schemas';
import { PurchaseOrderItemList } from './purchase-order-item-list';

interface DetailProps {
  purchaseOrder: PurchaseOrderSchemaAPI;
  onCancel?: () => void;
}

export function PurchaseOrderDetail({ purchaseOrder, onCancel }: DetailProps) {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Proveedor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Nombre:</p>
                  <p>{purchaseOrder.supplierName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Número de Orden:</p>
                  <p>{purchaseOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Fecha de la Orden:</p>

                  <p>{purchaseOrder?.orderDate?.split('T')[0]}</p>
                </div>
                <div>
                  <p className="font-semibold">Estado:</p>
                  <p>
                    {ESTATUS_TYPES[
                      purchaseOrder.status as keyof typeof ESTATUS_TYPES
                    ] ?? purchaseOrder.status}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Observaciones:</p>
                  <p>{purchaseOrder.observations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items de la Orden</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseOrderItemList items={purchaseOrder.items ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Financiero</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="font-semibold">Subtotal:</p>
                <p>{purchaseOrder.subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="font-semibold">Impuestos:</p>
                <p>{purchaseOrder.taxAmount?.toFixed(2)}</p>
              </div>
              <div className="flex justify-between font-bold">
                <p>Total:</p>
                <p>{purchaseOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="border-t pt-4 flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cerrar
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
