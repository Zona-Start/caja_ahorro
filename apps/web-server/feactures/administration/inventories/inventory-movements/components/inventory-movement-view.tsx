// apps/web/feactures/administration/inventories/inventory-movements/components/inventory-movement-view.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Label } from '@repo/shadcn/components/ui/label'; // Assuming Label component exists
import { MOVEMENT_TYPES } from '../schemas/inventory-movement-options';
import { InventoryMovement } from '../schemas/inventory-movement.schema';

interface InventoryMovementViewProps {
  data: InventoryMovement;
}

export default function InventoryMovementView({
  data,
}: InventoryMovementViewProps) {
  const movementTypeLabel =
    MOVEMENT_TYPES[data.movementType as keyof typeof MOVEMENT_TYPES] ||
    data.movementType;
  const itemTypeLabel =
    data.itemType === 'PRODUCT' ? 'PRODUCTO' : 'ACTIVO FIJO';
  const itemName =
    data.itemType === 'PRODUCT'
      ? data.productName
      : `${data.fixedAssetCode ? data.fixedAssetCode + ' - ' : ''}${data.fixedAssetName}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Movimiento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Tipo de Movimiento:</Label>
            <p className="font-medium">{movementTypeLabel}</p>
          </div>
          <div>
            <Label>Descripción:</Label>
            <p className="font-medium">{data.description}</p>
          </div>
          <div>
            <Label>Tipo de Ítem:</Label>
            <p className="font-medium">{itemTypeLabel}</p>
          </div>
          <div>
            <Label>Nombre del Ítem:</Label>
            <p className="font-medium">{itemName}</p>
          </div>
          <div>
            <Label>Cantidad:</Label>
            <p className="font-medium">{data.quantity}</p>
          </div>
          <div>
            <Label>Costo Unitario:</Label>
            <p className="font-medium">Bs. {data.unitCost ?? 'N/A'}</p>
          </div>
          <div>
            <Label>Tipo de Documento:</Label>
            <p className="font-medium">{data.documentType ?? 'N/A'}</p>
          </div>
          <div>
            <Label>Número de Documento:</Label>
            <p className="font-medium">{data.documentNumber ?? 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <Label>Notas:</Label>
            <p className="font-medium">{data.notes ?? 'N/A'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
