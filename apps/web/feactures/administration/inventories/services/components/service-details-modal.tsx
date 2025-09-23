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
import { SERVICE_STATUS_TYPES } from '../schemas';
import { Service } from '../schemas/service.schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Partial<Service>;
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

export default function ServiceDetailsModal({
  open,
  onOpenChange,
  service,
}: Props) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const calculatedCost =
    Number(service?.supplierCost ?? 0) + Number(service?.otherCosts ?? 0); // Ejemplo de cálculo
  const calculatedCostTixed =
    calculatedCost * (1 + (service?.purchaseTax ?? 0) / 100); // Ejemplo de cálculo

  const status = service?.status;
  const statusLabel =
    SERVICE_STATUS_TYPES[status as keyof typeof SERVICE_STATUS_TYPES] || status;

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
      case 'INACTIVE':
        return 'destructive';
      default:
        return 'default';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] z-50">
        <DialogHeader>
          <DialogTitle>Detalles del Servicio</DialogTitle>
          <DialogDescription>
            Información detallada del servicio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailItem label="Código" value={service?.serviceCode} />
              <DetailItem label="Nombre" value={service?.name} />
              <DetailItem label="Categoría" value={service?.categoryName} />
              <DetailItem
                label="Estatus"
                value={
                  <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                }
              />
              <div className="col-span-2">
                <DetailItem label="Descripción" value={service?.description} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Costos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-5 gap-4">
              <DetailItem
                label="Costo Proveedor"
                value={formatCurrency(
                  Number(service?.supplierCost ?? 0),
                  'VES',
                )}
              />
              <DetailItem
                label="Otros Costos"
                value={formatCurrency(Number(service?.otherCosts ?? 0), 'VES')}
              />
              <DetailItem
                label="I.V.A"
                value={`${service?.purchaseTax || 0} %`}
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
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
