import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { FixedAsset } from '../schemas/fixed-asset.schema';
import FixedAssetForm from './fixed-asset-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<FixedAsset>;
  readOnly?: boolean; // Add this prop definition
}

export default function FixedAssetModal({
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
      <DialogContent className="sm:max-w-[600px] z-50 backdrop-blur-lg bg-background/80">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el producto
          </DialogDescription>
        </DialogHeader>
        <FixedAssetForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
