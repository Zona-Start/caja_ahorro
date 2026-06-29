import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import { formatCurrency } from '@/lib/format-utils';
import type { InventoryFixedAsset } from '../schemas/inventory-fixed-assets.schema';
import {
  FIXED_ASSET_STATUS_OPTIONS,
  DEPRECIATION_METHOD_OPTIONS,
  FixedAssetStatus,
} from '../schemas/inventory-fixed-assets-options';

interface InventoryFixedAssetsDetailProps {
  data?: Partial<InventoryFixedAsset>;
  onClose: () => void;
}

const getStatusVariant = (
  status: string,
): 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning' => {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'UNDER_MAINTENANCE':
      return 'warning';
    case 'INACTIVE':
      return 'secondary';
    case 'DEREGISTERED':
      return 'destructive';
    default:
      return 'default';
  }
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-1">
    {children}
  </h4>
);

const Field = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">
      {value !== null && value !== undefined && value !== ''
        ? String(value)
        : '—'}
    </p>
  </div>
);

export function InventoryFixedAssetsDetail({
  data,
  onClose,
}: InventoryFixedAssetsDetailProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No hay datos disponibles</p>
        <Button onClick={onClose} className="mt-4">
          Cerrar
        </Button>
      </div>
    );
  }

  const status = data.assetStatus as string;
  const statusLabel =
    FIXED_ASSET_STATUS_OPTIONS[status as keyof typeof FIXED_ASSET_STATUS_OPTIONS] ?? status;
  const depreciationLabel =
    DEPRECIATION_METHOD_OPTIONS[
      (data.depreciationMethod as string) as keyof typeof DEPRECIATION_METHOD_OPTIONS
    ] ?? data.depreciationMethod;

  const formatDate = (date?: Date | string | null) => {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 py-4">
      <section>
        <SectionTitle>Información General</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Código de Activo" value={data.assetCode} />
          <Field label="Nombre" value={data.name} />
          <Field label="Categoría" value={data.categoryName} />
          <Field label="Marca" value={data.brand} />
          <Field label="Modelo" value={data.model} />
          <Field label="Número de Serie" value={data.serialNumber} />
          <Field
            label="Fecha de Adquisición"
            value={formatDate(data.acquisitionDate)}
          />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={getStatusVariant(status)}>{statusLabel}</Badge>
          </div>
        </div>
        {data.description && (
          <div className="mt-4">
            <Field label="Descripción" value={data.description} />
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Información Contable y Depreciación</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Costo Base"
            value={formatCurrency(data.baseCost ?? 0, 'VES')}
          />
          <Field
            label="Otros Costos"
            value={formatCurrency(data.otherCosts ?? 0, 'VES')}
          />
          <Field
            label="Impuesto de Compra"
            value={formatCurrency(data.purchaseTax ?? 0, 'VES')}
          />
          <Field
            label="Método de Depreciación"
            value={depreciationLabel}
          />
          <Field
            label="Vida Útil (años)"
            value={data.usefulLifeYears ?? 0}
          />
          <Field
            label="Depreciación Acumulada"
            value={formatCurrency(data.accumulatedDepreciation ?? 0, 'VES')}
          />
          <Field
            label="Última Depreciación"
            value={formatDate(data.lastDepreciationDate)}
          />
        </div>
      </section>

      <section>
        <SectionTitle>Información de Baja</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Fecha de Baja"
            value={formatDate(data.disposalDate)}
          />
          <Field
            label="Valor de Baja"
            value={
              data.disposalValue
                ? formatCurrency(data.disposalValue, 'VES')
                : '—'
            }
          />
          <Field
            label="Motivo de Baja"
            value={data.disposalReason}
          />
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
