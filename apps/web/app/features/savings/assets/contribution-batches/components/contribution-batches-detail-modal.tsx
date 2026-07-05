'use client';

import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { formatCurrency } from '@/lib/format-utils';
import { useQueryContributionBatchById } from '../hooks/use-contribution-batches-query';
import {
  TYPE_LABEL,
  MOVEMENT_TYPE_LABEL,
  STATUS_LABEL,
} from '../schemas/contribution-batches-options';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  batchId: string;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right">{value}</span>
  </div>
);

export function ContributionBatchesDetailModal({
  isOpen,
  onClose,
  batchId,
}: Props) {
  const { data, isLoading } = useQueryContributionBatchById(batchId, {
    enabled: isOpen,
  });

  const batch = data?.data;

  if (!batch) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles de la Carga</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            {isLoading ? 'Cargando...' : 'No se encontraron detalles'}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const status = batch.status;
  const statusVariant = status === 'reversed' ? 'destructive' : 'success';
  const type = batch.type;
  const typeVariant = type === 'massive' ? 'secondary' : 'success';
  const associates = (batch as any).associates || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Carga</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex gap-2">
            <Badge variant={typeVariant as any}>
              {TYPE_LABEL[type] || type}
            </Badge>
            <Badge variant={statusVariant as any}>
              {STATUS_LABEL[status] || status}
            </Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <DetailItem
              label="Movimiento"
              value={MOVEMENT_TYPE_LABEL[batch.movementType] || batch.movementType}
            />
            <DetailItem label="Fecha" value={batch.entryDate} />
            <DetailItem label="Descripción" value={batch.description || '—'} />
            <DetailItem
              label="Monto Total"
              value={
                <span className="font-mono">
                  {formatCurrency(Number(batch.totalAmount) || 0, 'VES')}
                </span>
              }
            />
            <DetailItem label="Asociados" value={batch.associateCount} />
          </div>

          {(batch.amountVoluntario || batch.amountPatrono || batch.amountAsociado) && (
            <>
              <Separator />
              <div className="space-y-2">
                {batch.amountVoluntario && (
                  <DetailItem
                    label="Aporte Voluntario"
                    value={
                      <span className="font-mono">
                        {formatCurrency(Number(batch.amountVoluntario), 'VES')}
                      </span>
                    }
                  />
                )}
                {batch.amountPatrono && (
                  <DetailItem
                    label="Aporte Patrono"
                    value={
                      <span className="font-mono">
                        {formatCurrency(Number(batch.amountPatrono), 'VES')}
                      </span>
                    }
                  />
                )}
                {batch.amountAsociado && (
                  <DetailItem
                    label="Aporte Asociado"
                    value={
                      <span className="font-mono">
                        {formatCurrency(Number(batch.amountAsociado), 'VES')}
                      </span>
                    }
                  />
                )}
              </div>
            </>
          )}

          {associates.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-primary mb-2">
                  Asociados en esta carga
                </p>
                <div className="border rounded-md">
                  {associates.map((assoc: any, i: number) => (
                    <div
                      key={assoc.id}
                      className={`flex justify-between items-center px-3 py-2 text-sm ${i < associates.length - 1 ? 'border-b' : ''
                        }`}
                    >
                      <div>
                        <span className="font-medium">{assoc.fullname}</span>
                        <span className="text-muted-foreground ml-2 font-mono text-xs">
                          {assoc.cedula}
                        </span>
                      </div>
                      <span className="font-mono text-xs">
                        {formatCurrency(Number(assoc.amount) || 0, 'VES')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {batch.bankData && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-primary">Datos Bancarios</p>
                {(batch.bankData as any)?.referenceNumber && (
                  <DetailItem
                    label="Nro. Referencia"
                    value={(batch.bankData as any).referenceNumber}
                  />
                )}
                {(batch.bankData as any)?.paymentMethod && (
                  <DetailItem
                    label="Método"
                    value={(batch.bankData as any).paymentMethod}
                  />
                )}
              </div>
            </>
          )}

          {batch.reversalEntryId && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Información de Anulación
                </p>
                <DetailItem
                  label="Asiento de Reverso"
                  value={
                    <span className="font-mono text-xs">
                      {batch.reversalEntryId}
                    </span>
                  }
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
