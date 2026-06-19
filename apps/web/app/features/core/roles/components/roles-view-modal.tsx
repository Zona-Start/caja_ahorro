import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useMemo } from 'react';
import type { Role } from '../schemas/roles.schema';
import { groupPermissions } from './permission-groups';
import { useAuthStore } from '@/stores/auth.store';

interface RolesViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Role;
}

export function RolesViewModal({
  open,
  onOpenChange,
  data,
}: RolesViewModalProps) {
  const grouped = useMemo(() => {
    if (!data?.rolePermissions) return [];
    const perms = data.rolePermissions.map((rp) => rp.permission);
    return groupPermissions(perms);
  }, [data]);
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{data.name}</DialogTitle>
          <DialogDescription>
            Información del rol y permisos asignados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 shrink-0">
          <div className="grid grid-cols-1 grid-cols-2 gap-3">
            {isSystemAdmin && (
              <div>
                <span className="text-xs text-muted-foreground">Empresa</span>
                <p className="text-sm font-medium">
                  {data.tenant?.name || data.tenantId}
                </p>
              </div>
            )}
            <div>
              <span className="text-xs text-muted-foreground">Rol por Defecto</span>
              <p className="text-sm font-medium">
                <Badge variant={data.isDefault ? 'default' : 'secondary'}>
                  {data.isDefault ? 'Sí' : 'No'}
                </Badge>
              </p>
            </div>
          </div>
          {data.description && (
            <div>
              <span className="text-xs text-muted-foreground">Descripción</span>
              <p className="text-sm">{data.description}</p>
            </div>
          )}
        </div>

        {grouped.length > 0 && (
          <div className="flex-1 min-h-0 flex flex-col mt-3">
            <span className="text-xs text-muted-foreground mb-2 shrink-0">
              Permisos Asignados ({data.rolePermissions?.length || 0})
            </span>
            <div className="flex-1 min-h-0 overflow-y-auto rounded-md border p-3">
              <div className="space-y-3">
                {grouped.map((group) => (
                  <Card key={group.prefix}>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm font-semibold">
                        {group.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-1 px-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                      {group.permissions.map((p) => (
                        <div
                          key={p.id}
                          className="text-sm flex items-center gap-2 py-0.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {p.name}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end shrink-0 pt-3">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
