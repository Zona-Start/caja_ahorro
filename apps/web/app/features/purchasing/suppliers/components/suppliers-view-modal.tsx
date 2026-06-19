import { useMemo } from 'react';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Phone, User } from 'lucide-react';
import { QUERY_KEYS } from '@/lib/query-keys';
import { getStatesAction } from '../../../core/states/services/querys-states';
import { CATEGORY_OPTIONS, STATUS_OPTIONS } from '../schemas/suppliers-options';
import type { Supplier } from '../schemas/suppliers.schema';

interface SuppliersViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Supplier;
}

const getCategoryLabel = (value: string) =>
  CATEGORY_OPTIONS.find((opt) => opt.value === value)?.label || value;

const getStatusLabel = (value: string) =>
  STATUS_OPTIONS.find((opt) => opt.value === value)?.label || value;

const getStatusVariant = (value: string) =>
  value === 'ACTIVE' ? 'success' : 'destructive';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  iconColor,
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {children}
      </CardContent>
    </Card>
  );
}

export function SuppliersViewModal({
  open,
  onOpenChange,
  data,
}: SuppliersViewModalProps) {
  if (!data) return null;

  const { data: statesData } = useQuery({
    queryKey: QUERY_KEYS.states.list({}),
    queryFn: () => getStatesAction(),
  });

  const stateName = useMemo(() => {
    if (!data.state || !statesData) return '—';
    const found = statesData.find((s: { id?: number; name: string }) => s.id === data.state);
    return found?.name ?? '—';
  }, [data.state, statesData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Proveedor</DialogTitle>
          <DialogDescription>
            Información completa del proveedor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <SectionCard icon={Building2} title="Información General" iconColor="text-blue-600">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Nombre" value={data.name} />
              <InfoRow label="Código Interno" value={data.internalCode || '—'} />
              <InfoRow label="RIF" value={data.taxId} />
              <InfoRow label="Categoría" value={getCategoryLabel(data.category)} />
              <div>
                <span className="text-xs text-muted-foreground">Estado</span>
                <div className="mt-0.5">
                  <Badge variant={getStatusVariant(data.status)}>
                    {getStatusLabel(data.status)}
                  </Badge>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={MapPin} title="Ubicación" iconColor="text-emerald-600">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <InfoRow label="Dirección" value={data.address || '—'} />
              </div>
              <InfoRow label="Estado" value={stateName} />
            </div>
          </SectionCard>

          <SectionCard icon={Phone} title="Contacto" iconColor="text-purple-600">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Teléfono" value={data.phone || '—'} />
              <InfoRow label="Correo" value={data.email || '—'} />
            </div>
          </SectionCard>

          <SectionCard icon={User} title="Persona de Contacto" iconColor="text-amber-600">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Nombre" value={data.contactName || '—'} />
              <InfoRow label="Teléfono" value={data.contactPhone || '—'} />
              <div className="col-span-2">
                <InfoRow label="Correo" value={data.contactEmail || '—'} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
