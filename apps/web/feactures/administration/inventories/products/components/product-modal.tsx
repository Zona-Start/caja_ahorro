import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Product } from '../schemas/product.schema';
import ProductForm from './product-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Product>;
  readOnly?: boolean;
}

export default function ProductModal({
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
      <DialogContent className="sm:max-w-[800px] z-50 ">
        <DialogHeader>
          <DialogTitle>
            {readOnly
              ? 'Información del producto'
              : defaultValues
                ? 'Editar producto'
                : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'Detalles del producto'
              : ` Complete los campos para  ${defaultValues?.id ? 'actualizar el' : 'crear un nuevo'} producto.`}
          </DialogDescription>
        </DialogHeader>
        <ProductForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
