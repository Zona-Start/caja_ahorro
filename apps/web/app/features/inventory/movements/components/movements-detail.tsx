import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import { formatCurrency } from '@/lib/format-utils';
import type { InventoryMovement } from '../schemas/movements.schema';
import {
  MOVEMENT_TYPE_OPTIONS,
  MOVEMENT_TYPE_BADGE_VARIANT,
  MOVEMENT_STATUS_OPTIONS,
  MOVEMENT_STATUS_BADGE_VARIANT,
} from '../schemas/movements-options';

interface MovementsDetailProps {
  data?: Partial<InventoryMovement>;
  onClose: () => void;
}

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
      {value !== null && value !== undefined && value !== '' ? String(value) : '—'}
    </p>
  </div>
);

export function MovementsDetail({ data, onClose }: MovementsDetailProps) {
  if (!data) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No hay datos disponibles</p>
        <Button onClick={onClose} className="mt-4">Cerrar</Button>
      </div>
    );
  }

  const typeKey = data.movementType as string;
  const typeLabel = MOVEMENT_TYPE_OPTIONS[typeKey as keyof typeof MOVEMENT_TYPE_OPTIONS] ?? typeKey;
  const typeVariant = (MOVEMENT_TYPE_BADGE_VARIANT[typeKey as keyof typeof MOVEMENT_TYPE_BADGE_VARIANT] ?? 'default') as 'default' | 'success' | 'destructive' | 'warning' | 'secondary' | 'outline';
  const statusKey = data.status as string;
  const statusLabel = MOVEMENT_STATUS_OPTIONS[statusKey] ?? statusKey;
  const statusVariant = (MOVEMENT_STATUS_BADGE_VARIANT[statusKey] ?? 'default') as 'default' | 'success' | 'destructive';

  const formatDate = (date?: Date | string | null) => {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const items = data.items ?? [];
  const totalItems = items.reduce((sum: number, i) => sum + (i.quantity ?? 0), 0);
  const totalCost = items.reduce((sum: number, i) => sum + (i.totalCost ?? 0), 0);
  const totalCostForeign = items.reduce(
    (sum: number, i) =>
      sum + Number(i.quantity ?? 0) * Number((i as any).unitCostForeign ?? 0),
    0,
  );
  const hasForeign = items.some(
    (i) => !!(i as any).currencyCode && (i as any).currencyCode !== 'VES',
  );

  return (
    <div className="space-y-6 py-4">
      <section>
        <SectionTitle>Encabezado</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nro. Movimiento" value={data.movementNumber} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tipo</p>
            <Badge variant={typeVariant}>{typeLabel}</Badge>
          </div>
          <Field label="Fecha" value={formatDate(data.movementDate)} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <Field label="Descripción" value={data.description} />
        </div>
      </section>

      <section>
        <SectionTitle>Productos</SectionTitle>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-2 text-left">Código</th>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Costo Unit.</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{item.productCode ?? '—'}</td>
                  <td className="px-3 py-2">{item.productName ?? '—'}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.unitCost ?? 0, 'VES')}
                    {(item as any).currencyCode &&
                      (item as any).currencyCode !== 'VES' &&
                      Number((item as any).unitCostForeign) > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          {(item as any).currencyCode}{' '}
                          {Number((item as any).unitCostForeign).toFixed(2)} ×{' '}
                          {Number((item as any).exchangeRate ?? 1).toFixed(2)}
                        </div>
                      )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(item.totalCost ?? 0, 'VES')}
                    {(item as any).currencyCode &&
                      (item as any).currencyCode !== 'VES' &&
                      Number((item as any).unitCostForeign) > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          {(item as any).currencyCode}{' '}
                          {(
                            Number(item.quantity) *
                            Number((item as any).unitCostForeign)
                          ).toFixed(2)}
                        </div>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle>Resumen</SectionTitle>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Productos: </span>
            <span className="font-bold">{items.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Cantidad Total: </span>
            <span className="font-bold">{totalItems}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Costo Total: </span>
            <span className="font-bold">{formatCurrency(totalCost, 'VES')}</span>
            {hasForeign && (
              <span className="ml-2 text-xs text-muted-foreground">
                (divisa {totalCostForeign.toFixed(2)})
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t">
        <Button variant="outline" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
}
