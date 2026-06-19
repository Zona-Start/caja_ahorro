import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import type { User } from '../schemas/users.schema';

interface UsersViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: User;
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive' | 'default' }> = {
  active: { label: 'Activo', variant: 'success' },
  inactive: { label: 'Inactivo', variant: 'secondary' },
  blocked: { label: 'Bloqueado', variant: 'destructive' },
};

export function UsersViewModal({
  open,
  onOpenChange,
  data,
}: UsersViewModalProps) {
  if (!data) return null;

  const firstMember = data.tenantMembers?.[0];
  const statusInfo = STATUS_CONFIG[data.status || ''] ?? {
    label: 'Desconocido',
    variant: 'default' as const,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalles del Usuario</DialogTitle>
          <DialogDescription>
            Información completa del usuario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Usuario</span>
              <p className="text-sm font-medium">{data.username}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Estado</span>
              <p className="text-sm font-medium">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Nombre Completo
              </span>
              <p className="text-sm font-medium">{data.fullname}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Correo</span>
              <p className="text-sm font-medium">{data.email}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Empresa</span>
              <p className="text-sm font-medium">
                {firstMember?.tenant?.name || '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Rol</span>
              <p className="text-sm font-medium">
                {firstMember?.role?.name || '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Administrador del Sistema
              </span>
              <p className="text-sm font-medium">
                <Badge
                  variant={data.isSystemAdmin ? 'default' : 'secondary'}
                >
                  {data.isSystemAdmin ? 'Sí' : 'No'}
                </Badge>
              </p>
            </div>
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
