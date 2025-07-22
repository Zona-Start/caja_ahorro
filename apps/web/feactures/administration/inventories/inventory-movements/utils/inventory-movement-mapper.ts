import { InventoryMovement } from '../schemas/inventory-movement.schema';

export function mapInventoryMovementApiToForm(data: any): InventoryMovement {
  return {
    id: data.id,
    productId: data.productId,
    movementType: data.movementType,
    quantity: data.quantity,
    unitCost: data.unitCost,
    documentType: data.documentType,
    documentNumber: data.documentNumber,
    notes: data.notes,
  };
}
