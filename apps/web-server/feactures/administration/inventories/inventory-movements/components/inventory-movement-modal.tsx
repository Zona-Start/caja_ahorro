import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  CreateInventoryMovement,
  InventoryMovement,
} from '../schemas/inventory-movement.schema'; // Changed import
import InventoryMovementForm from './inventory-movement-form';
import InventoryMovementView from './inventory-movement-view'; // New import

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<CreateInventoryMovement> | InventoryMovement; // Changed type
  readOnly?: boolean;
}

export default function InventoryMovementModal({
  open,
  onOpenChange,
  defaultValues,
  readOnly = false,
}: Props) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-[1000px] z-50  ">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Detalles del Movimiento'
              : 'Nuevo movimiento de inventario'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Información detallada del movimiento de inventario.'
              : 'Complete los campos para crear un nuevo movimiento de inventario.'}
          </DialogDescription>
        </DialogHeader>
        {readOnly ? (
          <InventoryMovementView data={defaultValues as InventoryMovement} />
        ) : (
          <InventoryMovementForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            defaultValues={defaultValues as Partial<CreateInventoryMovement>}
            readOnly={readOnly}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
