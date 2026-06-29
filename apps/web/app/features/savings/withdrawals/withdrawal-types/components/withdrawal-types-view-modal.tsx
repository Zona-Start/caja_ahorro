import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { useQuery } from '@tanstack/react-query';
import { FileText, Settings, Clock, Percent } from 'lucide-react';
import { useWithdrawalTypeQuery } from '../hooks/use-withdrawal-types-query';
import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { CATEGORY_TYPES } from '@/features/core/categories/schemas/categories.schema';
import type { WithdrawalType } from '../schemas/withdrawal-types.schema';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawalType?: WithdrawalType | null;
}

export function WithdrawalTypesViewModal({ open, onOpenChange, withdrawalType }: Props) {
  const { data: frequencyCategories } = useCategoriesByTypeQuery(CATEGORY_TYPES.DISCOUNT_FREQUENCY);

  if (!withdrawalType) return null;

  const frequencyName = frequencyCategories?.find(
    (c) => c.id === withdrawalType.withdrawalFrequencyRelation,
  )?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Tipo de Retiro</DialogTitle>
          <DialogDescription>Información completa del tipo de retiro.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información General */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-semibold">Información General</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Descripción" value={withdrawalType.description} />
                <InfoRow label="Casa Comercial" value={
                  <Badge variant={withdrawalType.isHouseComercial ? 'default' : 'secondary'}>
                    {withdrawalType.isHouseComercial ? 'Sí' : 'No'}
                  </Badge>
                } />
                <InfoRow label="Utiliza Inventario" value={
                  <Badge variant={withdrawalType.isInternalInventory ? 'default' : 'secondary'}>
                    {withdrawalType.isInternalInventory ? 'Sí' : 'No'}
                  </Badge>
                } />
              </div>
            </CardContent>
          </Card>

          {/* Parámetros de Retiro */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Percent className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold">Parámetros de Retiro</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow
                  label="% Máximo de Retiro"
                  value={withdrawalType.withdrawalPercentage != null ? `${withdrawalType.withdrawalPercentage}%` : '—'}
                />
                <InfoRow
                  label="% Gasto Administrativo"
                  value={withdrawalType.administrativeFeePercentage != null ? `${withdrawalType.administrativeFeePercentage}%` : '—'}
                />
                <InfoRow
                  label="Límite de Retiros"
                  value={withdrawalType.withdrawalLimitQuantity ?? '—'}
                />
                <InfoRow
                  label="Antigüedad Mínima (días)"
                  value={withdrawalType.minimumAntiquityDays ?? '—'}
                />
                <div className="md:col-span-2">
                  <InfoRow
                    label="Frecuencia de Retiros"
                    value={frequencyName || withdrawalType.withdrawalFrequencyRelation || '—'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
              <Clock className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-semibold">Registro</h3>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Creado" value={withdrawalType.createdAt ? new Date(withdrawalType.createdAt).toLocaleDateString('es-VE') : '—'} />
                <InfoRow label="Actualizado" value={withdrawalType.updatedAt ? new Date(withdrawalType.updatedAt).toLocaleDateString('es-VE') : '—'} />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
