import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { MODULE_LABELS } from '../constants/modules-constants';
import { useTenantModulesQuery } from '../hooks/use-tenants-queries';
import { useTenantsDetailStore } from '../store/tenants-detail-store';

export function TenantsDetailModal() {
  const { isOpen, data, closeDetail } = useTenantsDetailStore();
  const { data: modules = [] } = useTenantModulesQuery(
    data?.id ?? '',
    isOpen && !!data?.id,
  );

  const activeModules = modules.filter((m) => m.status === 'ENABLED');

  const detailRows = [
    { label: 'RIF', value: data?.rif },
    { label: 'Correo', value: data?.email },
    {
      label: 'Tipo de Cliente',
      value:
        data?.businessType === 'CAJA_AHORRO'
          ? 'Caja de Ahorro'
          : data?.businessType === 'EMPRESA_COMERCIAL'
            ? 'Empresa Comercial'
            : data?.businessType,
    },
    { label: 'Teléfono', value: data?.phone || '—' },
    { label: 'Dirección', value: data?.address || '—' },
    { label: 'Espacio de trabajo', value: data?.slug || '—' },
    { label: 'Dominio personalizado', value: data?.customDomain || '—' },
  ];

  const contactRows = [
    { label: 'Nombre de Contacto', value: data?.contactName || '—' },
    { label: 'Cédula de Contacto', value: data?.contactCedula || '—' },
    { label: 'Teléfono de Contacto', value: data?.contactPhone || '—' },
    { label: 'Correo de Contacto', value: data?.contactEmail || '—' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDetail()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data?.name ?? 'Detalles del Cliente'}</DialogTitle>
          <DialogDescription>
            Información completa del cliente y sus módulos activos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Información General
            </h4>
            <div className="rounded-lg border divide-y">
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-right max-w-[60%] break-words">
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">Estado</span>
                <span>
                  {data?.isActive ? (
                    <Badge
                      variant="success"
                      className="bg-green-100 text-green-700 hover:bg-green-100"
                    >
                      Activo
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Información de Contacto
            </h4>
            <div className="rounded-lg border divide-y">
              {contactRows.map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between px-4 py-2.5 text-sm"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-right max-w-[60%] break-words">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              Módulos Activos
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeModules.length > 0 ? (
                activeModules.map((mod) => (
                  <Badge key={mod.id} variant="secondary">
                    {MODULE_LABELS[
                      mod.moduleCode as keyof typeof MODULE_LABELS
                    ] ?? mod.moduleCode}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Sin módulos activos
                </span>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={closeDetail}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
