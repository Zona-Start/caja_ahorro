import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/components/ui/dialog';
import { FixedAssetCategories } from '../schemas/fixed-asset-categories.schema';
import FixedAssetCategoriesForm from './fixed-asset-categories-form';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<FixedAssetCategories>;
  readOnly?: boolean; // Add this prop definition
}

export default function FixedAssetCategoriesModal({
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
            {defaultValues ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogDescription>
            Complete los campos para{' '}
            {defaultValues?.id ? 'actualizar' : 'crear'} el tipo de categoria
          </DialogDescription>
        </DialogHeader>
        <FixedAssetCategoriesForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
