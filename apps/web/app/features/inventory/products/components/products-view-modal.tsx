import { useMemo, type ComponentType, type ReactNode } from 'react';
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
import { Card, CardContent, CardHeader } from '@repo/shadcn/card';
import { Separator } from '@repo/shadcn/separator';
import {
  Package,
  Settings,
  Box,
  DollarSign,
  BadgePercent,
  Tag,
  Truck,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/query-keys';
import { ProductsService } from '../services/products-service';
import { useCategoriesQuery } from '../hooks/use-products-queries';
import { UNIT_MEASURES } from '../schemas/products-options';

interface ProductsViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

const statusTranslations: Record<string, string> = {
  AVAILABLE: 'Disponible',
  DISABLED: 'Deshabilitado',
  OUT_OF_STOCK: 'Agotado',
  COMMING_SOON: 'Próximamente',
  ON_SALE: 'En oferta',
};

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AVAILABLE: 'default',
  DISABLED: 'secondary',
  OUT_OF_STOCK: 'destructive',
  COMMING_SOON: 'outline',
  ON_SALE: 'outline',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  VES: 'Bs.',
  USD: '$',
  EUR: '€',
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
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
  icon: ComponentType<{ className?: string }>;
  title: string;
  iconColor: string;
  children: ReactNode;
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

export function ProductsViewModal({ open, onOpenChange, productId }: ProductsViewModalProps) {
  const { data: product, isLoading } = useQuery({
    queryKey: QUERY_KEYS.products.detail(productId!),
    queryFn: () => ProductsService.getById(productId!),
    enabled: !!productId && open,
  });

  const { data: categories } = useCategoriesQuery();
  const sym = CURRENCY_SYMBOLS[product?.currencyCode ?? 'VES'];

  const isForeignCurrency = product?.currencyCode && product.currencyCode !== 'VES';
  const offerActive = isForeignCurrency
    ? (Number(product?.offerSalePrice) || 0) > 0
    : (product?.profitSupply ?? 0) > 0;

  const costCalc = useMemo(() => {
    if (!product) return null;
    const base = Number(product.supplierCost) || 0;
    const other = Number(product.otherCosts) || 0;
    const taxPct = Number(product.purchaseTaxPercent) || 0;
    const pRate = Number(product.purchaseExchangeRate) || 1;
    const taxAmount = (base + other) * (taxPct / 100);
    const total = base + other + taxAmount;
    return {
      baseCost: base,
      otherCosts: other,
      purchaseTaxAmount: +taxAmount.toFixed(2),
      totalCost: +total.toFixed(2),
      totalCostVes: +(total * pRate).toFixed(2),
    };
  }, [product]);

  const priceCalc = useMemo(() => {
    if (!product || !costCalc) return null;
    const totalCost = costCalc.totalCost;
    const stPct = Number(product.salesTaxPercent) || 0;
    const sRate = Number(product.salesExchangeRate) || 1;

    if (isForeignCurrency && (Number(product.salePrice) || 0) > 0) {
      const sp = Number(product.salePrice) || 0;
      const finalGross = sp;
      const finalNet = +(finalGross / (1 + stPct / 100)).toFixed(6);
      const hasBs = (Number(product.bsPriceAmount) || 0) > 0;
      const vesMult = hasBs ? (Number(product.bsPriceAmount) || 0) : finalGross;
      return {
        costPlusExpense: totalCost,
        finalPriceNet: +finalNet.toFixed(2),
        salesTaxAmount: +(finalGross - finalNet).toFixed(2),
        finalPriceGross: +finalGross.toFixed(2),
        finalPriceGrossVes: +(vesMult * sRate).toFixed(2),
      };
    }

    const pPct = Number(product.profitSale) || 0;
    const ePct = Number(product.expensePercent) || 0;
    const costPlusExpense = totalCost * (1 + ePct / 100);
    const finalNet = costPlusExpense * (1 + pPct / 100);
    const salesTaxAmt = finalNet * (stPct / 100);
    const finalGross = finalNet + salesTaxAmt;
    return {
      costPlusExpense: +costPlusExpense.toFixed(2),
      finalPriceNet: +finalNet.toFixed(2),
      salesTaxAmount: +salesTaxAmt.toFixed(2),
      finalPriceGross: +finalGross.toFixed(2),
      finalPriceGrossVes: +(finalGross * sRate).toFixed(2),
    };
  }, [product, costCalc, isForeignCurrency]);

  const offerCalc = useMemo(() => {
    if (!product || !offerActive || !costCalc) return null;
    const stPct = Number(product.salesTaxPercent) || 0;
    const sRate = Number(product.salesExchangeRate) || 1;

    if (isForeignCurrency) {
      const sp = Number(product.offerSalePrice) || 0;
      const finalGross = sp;
      const finalNet = +(finalGross / (1 + stPct / 100)).toFixed(6);
      return {
        costPlusExpense: 0,
        finalPriceNet: +finalNet.toFixed(2),
        finalPriceGross: +finalGross.toFixed(2),
        finalPriceGrossVes: +(finalGross * sRate).toFixed(2),
      };
    }

    const totalCost = costCalc.totalCost;
    const pPct = Number(product.profitSupply) || 0;
    const ePct = Number(product.expensePercent) || 0;
    const costPlusExpense = totalCost * (1 + ePct / 100);
    const finalNet = costPlusExpense * (1 + pPct / 100);
    const salesTaxAmt = finalNet * (stPct / 100);
    const finalGross = finalNet + salesTaxAmt;
    return {
      costPlusExpense: +costPlusExpense.toFixed(2),
      finalPriceNet: +finalNet.toFixed(2),
      finalPriceGross: +finalGross.toFixed(2),
      finalPriceGrossVes: +(finalGross * sRate).toFixed(2),
    };
  }, [product, offerActive, costCalc, isForeignCurrency]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Producto</DialogTitle>
          <DialogDescription>
            Información completa del producto seleccionado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            Cargando información del producto...
          </div>
        ) : !product ? (
          <div className="flex justify-center py-8 text-sm text-muted-foreground">
            No se encontró información del producto.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Información Básica */}
            <SectionCard icon={Package} title="Información Básica" iconColor="text-blue-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Nombre" value={product.name} />
                <InfoRow label="SKU" value={product.sku || '-'} />
                <InfoRow label="Marca" value={product.brand || '-'} />
                <InfoRow label="Modelo" value={product.model || '-'} />
                <div className="md:col-span-2">
                  <InfoRow label="Descripción" value={product.description || '-'} />
                </div>
                <InfoRow label="Estado" value={
                  <Badge variant={statusVariant[product.status] || 'secondary'}>
                    {statusTranslations[product.status] || product.status}
                  </Badge>
                } />
              </div>
            </SectionCard>

            {/* Configuración */}
            <SectionCard icon={Settings} title="Configuración" iconColor="text-orange-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Categoría" value={categories?.find((c) => c.id === product.categoryId)?.name || product.categoryId || '-'} />
                <InfoRow label="Unidad de Medida" value={UNIT_MEASURES.find((u) => u.value === product.unitOfMeasure)?.label || product.unitOfMeasure || '-'} />
                <InfoRow label="Moneda de Operación" value={product.currencyCode} />
                <InfoRow label="IVA de Compra" value={`${product.purchaseTaxPercent}%`} />
                <InfoRow label="IVA de Venta" value={`${product.salesTaxPercent}%`} />
                {product.purchaseExchangeRate !== 1 && (
                  <InfoRow label="Tasa de Cambio (Compra)" value={String(product.purchaseExchangeRate)} />
                )}
                {product.salesExchangeRate !== 1 && (
                  <InfoRow label="Tasa de Cambio (Venta)" value={String(product.salesExchangeRate)} />
                )}
              </div>
            </SectionCard>

            {/* Stock */}
            <SectionCard icon={Box} title="Stock Inventario" iconColor="text-amber-600">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoRow label="Stock Mínimo" value={String(product.stockMin)} />
                <InfoRow label="Stock Máximo" value={String(product.stockMax)} />
                <InfoRow label="Punto de Reorden" value={String(product.reorderPoint)} />
              </div>
            </SectionCard>

            {/* Costos de Adquisición + Resumen */}
            <SectionCard icon={DollarSign} title="Costos de Adquisición" iconColor="text-green-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <InfoRow label="Costo del Proveedor" value={`${sym} ${Number(product.supplierCost).toFixed(2)}`} />
                  <InfoRow label="Otros Costos" value={`${sym} ${Number(product.otherCosts).toFixed(2)}`} />
                </div>
                {costCalc && Number(product.supplierCost) > 0 && (
                  <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                    <p className="font-medium text-muted-foreground mb-1">Resumen de Costos</p>
                    <div className="flex justify-between"><span>Costo Base:</span><span>{sym} {costCalc.baseCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Otros Costos:</span><span>{sym} {costCalc.otherCosts.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>IVA de Compra ({product.purchaseTaxPercent}%):</span><span>{sym} {costCalc.purchaseTaxAmount.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Costo Total:</span><span>{sym} {costCalc.totalCost.toFixed(2)}</span></div>
                    {isForeignCurrency && (
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Costo Total en VES:</span><span>Bs. {costCalc.totalCostVes.toFixed(2)}</span></div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Precio de Venta + Resumen */}
            <SectionCard icon={BadgePercent} title="Precio de Venta" iconColor="text-purple-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {isForeignCurrency ? (
                    <>
                      <InfoRow label={`Precio de Venta en ${product.currencyCode}`} value={`${sym} ${Number(product.salePrice || 0).toFixed(2)}`} />
                      {product.bsPriceAmount ? (
                        <InfoRow label="Precio para pago en Bs." value={`${sym} ${Number(product.bsPriceAmount).toFixed(2)}`} />
                      ) : null}
                    </>
                  ) : (
                    <>
                      <InfoRow label="Margen de Ganancia" value={`${product.profitSale}%`} />
                      <InfoRow label="Gastos Operativos" value={`${product.expensePercent}%`} />
                    </>
                  )}
                </div>
                {isForeignCurrency && (Number(product.salePrice) || 0) > 0 && priceCalc && (
                  <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                    <p className="font-medium text-muted-foreground mb-1">Resumen de Precio de Venta en {product.currencyCode}</p>
                    <div className="flex justify-between"><span>Precio Neto (sin IVA):</span><span>{sym} {priceCalc.finalPriceNet.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>IVA Venta ({product.salesTaxPercent}%):</span><span>{sym} {priceCalc.salesTaxAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold"><span>Precio Final en {product.currencyCode}:</span><span>{sym} {priceCalc.finalPriceGross.toFixed(2)}</span></div>
                    <Separator />
                    {(Number(product.bsPriceAmount) || 0) > 0 && (
                      <div className="flex justify-between font-semibold">
                        <span>Precio para pago en Bs.:</span>
                        <span>{sym} {Number(product.bsPriceAmount).toFixed(2)} × tasa = Bs. {priceCalc.finalPriceGrossVes.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
                {!isForeignCurrency && costCalc && costCalc.totalCost > 0 && priceCalc && (
                  <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                    <p className="font-medium text-muted-foreground mb-1">Resumen de Precio de Venta</p>
                    <div className="flex justify-between"><span>Costo Total:</span><span>{sym} {costCalc.totalCost.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Gastos ({product.expensePercent}%):</span><span>{sym} {(priceCalc.costPlusExpense - costCalc.totalCost).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Utilidad ({product.profitSale}%):</span><span>{sym} {(priceCalc.finalPriceNet - priceCalc.costPlusExpense).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>IVA Venta ({product.salesTaxPercent}%):</span><span>{sym} {priceCalc.salesTaxAmount.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-semibold"><span>Precio Final (con IVA):</span><span>{sym} {priceCalc.finalPriceGross.toFixed(2)}</span></div>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Oferta */}
            {offerActive && (
              <SectionCard icon={Tag} title="Oferta" iconColor="text-red-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    {isForeignCurrency ? (
                      <InfoRow label={`Precio Oferta en ${product.currencyCode}`} value={`${sym} ${Number(product.offerSalePrice).toFixed(2)}`} />
                    ) : (
                      <InfoRow label="Margen de Ganancia para Oferta" value={`${product.profitSupply}%`} />
                    )}
                    {product.offerStartDate && <InfoRow label="Fecha Inicio" value={product.offerStartDate} />}
                    {product.offerEndDate && <InfoRow label="Fecha Fin" value={product.offerEndDate} />}
                  </div>
                  {isForeignCurrency && offerCalc && (
                    <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                      <p className="font-medium text-muted-foreground mb-1">Resumen de Precio Oferta en {product.currencyCode}</p>
                      <div className="flex justify-between"><span>IVA Venta ({product.salesTaxPercent}%):</span><span>{sym} {(offerCalc.finalPriceGross - offerCalc.finalPriceNet).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Precio Oferta:</span><span>{sym} {offerCalc.finalPriceGross.toFixed(2)}</span></div>
                      <Separator />
                      {priceCalc && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Diferencia vs Precio Regular:</span>
                          <span className="text-red-500">{sym} {(priceCalc.finalPriceGross - offerCalc.finalPriceGross).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {!isForeignCurrency && offerCalc && costCalc && costCalc.totalCost > 0 && (
                    <div className="bg-muted/30 rounded-lg border p-3 space-y-1.5 text-sm">
                      <p className="font-medium text-muted-foreground mb-1">Resumen de Precio Oferta</p>
                      <div className="flex justify-between"><span>Precio Neto:</span><span>{sym} {offerCalc.finalPriceNet.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span>Precio Final (con IVA):</span><span>{sym} {offerCalc.finalPriceGross.toFixed(2)}</span></div>
                      <Separator />
                      {priceCalc && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Diferencia vs Precio Regular:</span>
                          <span className="text-red-500">{sym} {(priceCalc.finalPriceGross - offerCalc.finalPriceGross).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Proveedores */}
            {(product as any).suppliers?.length > 0 ? (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-3 pt-4 px-4">
                  <Truck className="h-5 w-5 text-sky-600" />
                  <h3 className="text-sm font-semibold text-foreground">Proveedores</h3>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {(product as any).suppliers?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{s.name || s.suppliersId}</Badge>
                      <span className="text-muted-foreground">{s.leadTimeDays} días de recepción</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
