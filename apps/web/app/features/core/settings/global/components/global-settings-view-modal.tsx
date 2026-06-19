import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { GlobalSetting } from '../schemas/global-settings.schema';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  notification: 'Notificaciones',
  security: 'Seguridad',
};

interface GlobalSettingsViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: GlobalSetting;
}

export function GlobalSettingsViewModal({
  open,
  onOpenChange,
  data,
}: GlobalSettingsViewModalProps) {
  const categoryLabel = CATEGORY_LABELS[data.category ?? 'general'] ?? data.category;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Detalles del Parámetro</DialogTitle>
          <DialogDescription>
            Información completa del parámetro global.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Clave</p>
              <p className="text-base font-mono font-semibold">{data.key}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Valor</p>
              <p className="text-base break-words">{data.value}</p>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Categoría</p>
              <Badge variant="outline" className="text-sm">
                {categoryLabel}
              </Badge>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base">{data.description || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Fecha de Creación
                </p>
                <p className="text-sm">
                  {data.createdAt
                    ? new Date(data.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Última Actualización
                </p>
                <p className="text-sm">
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
