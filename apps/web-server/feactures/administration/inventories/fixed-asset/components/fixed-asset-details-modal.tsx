import { formatCurrency } from '@/lib/formatCurrent';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { ScrollArea } from '@repo/shadcn/scroll-area';
import { ESTATUS_TYPES } from '../schemas/fixed-asset-options';
import { FixedAsset } from '../schemas/fixed-asset.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Partial<FixedAsset> & { categoryName?: string; totalCost?: number };
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-900 dark:text-white">{value ?? '-'}</p>
  </div>
);

export default function FixedAssetDetailsModal({
  open,
  onOpenChange,
  asset,
}: Props) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const status = asset?.assetStatus;
  const statusLabel =
    ESTATUS_TYPES[status as keyof typeof ESTATUS_TYPES] || status;

  const statusVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'UNDER_MAINTENANCE':
        return 'secondary';
      case 'INACTIVE':
        return 'warning';
      case 'DEREGISTERED':
        return 'destructive';
      default:
        return 'default';
    }
  })();

  const calculatedCost =
    Number(asset?.baseCost ?? 0) + Number(asset?.otherCosts ?? 0); // Ejemplo de cálculo
  const calculatedCostTixed =
    calculatedCost * (1 + (asset?.purchaseTax ?? 0) / 100); // Ejemplo de cálculo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] z-50">
        <DialogHeader>
          <DialogTitle>Detalles del Bien o Activo</DialogTitle>
          <DialogDescription>
            Información detallada del activo fijo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-4 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <DetailItem label="Código" value={asset?.assetCode} />
                <DetailItem label="Categoría" value={asset?.categoryName} />
                <DetailItem label="Nombre" value={asset?.name} />

                <DetailItem label="Marca" value={asset?.brand} />
                <DetailItem label="Modelo" value={asset?.model} />
                <DetailItem label="Serial" value={asset?.serialNumber} />
                <div className="col-span-2">
                  <DetailItem label="Descripción" value={asset?.description} />
                </div>
                <DetailItem
                  label="Estatus"
                  value={
                    <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adquisición y Depreciación</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <DetailItem
                  label="Fecha de Adquisición"
                  value={
                    asset?.acquisitionDate
                      ? new Date(asset.acquisitionDate).toLocaleDateString(
                          'es-VE',
                        )
                      : '-'
                  }
                />
                <DetailItem
                  label="Años de Vida Útil"
                  value={asset?.usefulLifeYears}
                />
                <DetailItem
                  label="Método de Depreciación"
                  value={asset?.depreciationMethod}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Costos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <DetailItem
                  label="Costo Base"
                  value={formatCurrency(Number(asset?.baseCost ?? 0), 'VES')}
                />
                <DetailItem
                  label="Otros Costos"
                  value={formatCurrency(Number(asset?.otherCosts ?? 0), 'VES')}
                />
                <DetailItem
                  label="I.V.A. Compra"
                  value={`${asset?.purchaseTax || 0} %`}
                />
                <DetailItem
                  label="Sin Impuesto"
                  value={formatCurrency(calculatedCost, 'VES')}
                />
                <DetailItem
                  label="Con Impuesto"
                  value={formatCurrency(calculatedCostTixed, 'VES')}
                />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
