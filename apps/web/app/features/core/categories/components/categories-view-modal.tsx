import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Badge } from '@repo/shadcn/badge';
import type { Category } from '../schemas/categories.schema';
import { TYPE_LABELS } from '../schemas/categories.schema';

interface CategoriesViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Category;
}

export function CategoriesViewModal({
  open,
  onOpenChange,
  data,
}: CategoriesViewModalProps) {
  if (!data) return null;

  const fields = [
    { label: 'Tipo', value: TYPE_LABELS[data.type] || data.type },
    { label: 'Código', value: data.code },
    { label: 'Nombre', value: data.name },
    { label: 'Descripción', value: data.description || '—' },
    {
      label: 'Estado',
      value: data.isActive ? 'Activo' : 'Inactivo',
      badge: true,
      active: data.isActive,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles de Categoría</DialogTitle>
          <DialogDescription>
            Información completa de la categoría.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground w-28 shrink-0">
                {f.label}
              </span>
              {f.badge ? (
                <Badge
                  variant="outline"
                  className={
                    f.active
                      ? 'text-green-600 border-green-300'
                      : 'text-red-500 border-red-300'
                  }
                >
                  {f.value}
                </Badge>
              ) : (
                <span className="text-sm">{f.value}</span>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
