import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { GROUP_TYPE_OPTIONS } from '../schemas/categories-options';
import type { Category } from '../schemas/categories.schema';

interface CategoriesViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Category;
}

const getGroupLabel = (value: string) => {
  return GROUP_TYPE_OPTIONS.find((opt) => opt.value === value)?.label || value;
};

export function CategoriesViewModal({
  open,
  onOpenChange,
  data,
}: CategoriesViewModalProps) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles de la Categoría</DialogTitle>
          <DialogDescription>
            Información completa de la categoría.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Nombre</span>
              <p className="text-sm font-medium">{data.name}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Grupo</span>
              <p className="text-sm font-medium">
                {getGroupLabel(data.group)}
              </p>
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Descripción</span>
            <p className="text-sm">{data.description || '—'}</p>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
