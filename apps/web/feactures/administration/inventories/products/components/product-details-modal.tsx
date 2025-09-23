import { formatCurrency } from '@/lib/formatCurrent';
import { useSystemConfigStore } from '@/store/SystemConfigStore';
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
import { Loader2 } from 'lucide-react';
import { PRODUCT_STATUS_TYPES, UNIT_OF_MEASURE_TYPES } from '../schemas';
import { ProductDetails } from '../utils/product-mapper';

const calculatePrice = (
  cost: number,
  utilityPercentage: number,
  expensePercentage: number,
  taxPercentage: number,
) => {
  // Calculate the price with the desired utility percentage.
  const priceWithUtility = cost * (1 + utilityPercentage / 100);

  // Calculate the final price by adding the administrative expenses.
  const priceWithExpenses = priceWithUtility * (1 + expensePercentage / 100);

  // Add the sales tax to the final price.
  const finalPrice = priceWithExpenses * (1 + taxPercentage / 100);

  return {
    priceWithUtility,
    finalPrice,
  };
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productData?: Partial<ProductDetails>;
  isLoading?: boolean;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value ?? '-'}</p>
    </div>
  );
};

export default function ProductDetailsModal({
  open,
  onOpenChange,
  productData,
  isLoading,
}: Props) {
  const handleCancel = () => {
    onOpenChange(false);
  };

  const { generalConfig } = useSystemConfigStore();
  const configPurchaseTax = generalConfig.filter(
    (item) => item.key === 'GASTO-PRODUCTO',
  );

  const taxFromConfig = Number(configPurchaseTax[0]?.value) || 0;

  // Calcular costo calculado automáticamente
  const baseCost = productData?.baseCost ?? 0;
  const otherCosts = productData?.otherCosts ?? 0;
  const purchaseTax = productData?.purchaseTax ?? 0;
  const calculatedCost = Number(baseCost) + Number(otherCosts); // Ejemplo de cálculo
  const calculatedCostTixed =
    calculatedCost * (1 + (Number(purchaseTax) ?? 0) / 100); // Ejemplo de cálculo

  //calcular precio de venta
  const utilSale = productData?.profitSale ?? 0; //utilidad en porcentaje
  const utilOffer = productData?.profitSupply ?? 0; //utilidad oferta en porcentaje
  const expense = taxFromConfig; //gastos administrativos en porcentaje
  const saleTax = productData?.saleTax ?? 0; //I.V.A. venta en porcentaje

  const saleprice = calculatePrice(
    calculatedCostTixed,
    utilSale,
    expense,
    saleTax ?? 0,
  );
  const offerPrice = calculatePrice(
    calculatedCostTixed,
    utilOffer,
    expense,
    saleTax ?? 0,
  );

  const unitTypeLabel =
    UNIT_OF_MEASURE_TYPES[
      productData?.unitType as keyof typeof UNIT_OF_MEASURE_TYPES
    ] || productData?.unitType;

  const status = productData?.status;
  const statusLabel =
    PRODUCT_STATUS_TYPES[status as keyof typeof PRODUCT_STATUS_TYPES] || status;

  const statusVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'AVAILABLE':
        return 'success';
      case 'DISABLED':
        return 'secondary';
      case 'OUT_OF_STOCK':
        return 'destructive';
      case 'COMMING_SOON':
        return 'warning';
      case 'ON_SALE':
        return 'default';
      default:
        return 'default';
    }
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] z-50">
        <DialogHeader>
          <DialogTitle>Detalles del Producto</DialogTitle>
          <DialogDescription>
            Información detallada del producto.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(100vh-250px)]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 p-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <DetailItem label="SKU" value={productData?.sku} />
                  <DetailItem label="Nombre" value={productData?.name} />
                  <DetailItem
                    label="Categoría"
                    value={productData?.categoryName}
                  />
                  <DetailItem label="Marca" value={productData?.brand} />
                  <DetailItem label="Modelo" value={productData?.model} />
                  <DetailItem
                    label="Descripción"
                    value={productData?.description}
                  />
                  <DetailItem label="Tipo de Unidad" value={unitTypeLabel} />
                  <DetailItem
                    label="Estatus"
                    value={
                      <Badge variant={statusVariant as any}>
                        {statusLabel}
                      </Badge>
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Configuración</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <DetailItem
                    label="Stock Mínimo"
                    value={productData?.stockMin}
                  />
                  <DetailItem
                    label="Stock Máximo"
                    value={productData?.stockMax}
                  />
                  <DetailItem
                    label="Punto de Reorden"
                    value={productData?.reorderPoint}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existencia</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <DetailItem label="Actual" value={productData?.available} />
                  <DetailItem
                    label="Disponible"
                    value={productData?.available}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Costos y Precios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold">Costos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <DetailItem
                        label="Costo Base"
                        value={formatCurrency(
                          Number(productData?.baseCost ?? 0),
                          'VES',
                        )}
                      />
                      <DetailItem
                        label="Otros Costos"
                        value={formatCurrency(
                          Number(productData?.otherCosts ?? 0),
                          'VES',
                        )}
                      />
                      <DetailItem
                        label="Costo Sin Impuesto"
                        value={formatCurrency(calculatedCost ?? 0, 'VES')}
                      />
                      <DetailItem
                        label="Costo Con Inpuesto"
                        value={formatCurrency(calculatedCostTixed ?? 0, 'VES')}
                      />
                    </div>
                  </div>

                  {productData?.profitSale && (
                    <div>
                      <h4 className="font-semibold">Precio de Venta</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                        <DetailItem
                          label="Costo Producto"
                          value={formatCurrency(
                            calculatedCostTixed ?? 0,
                            'VES',
                          )}
                        />
                        <DetailItem label="Utilidad" value={`${utilSale}%`} />
                        <DetailItem label="% Gastos" value={`${expense}%`} />
                        <DetailItem
                          label="Sin Impuesto"
                          value={formatCurrency(
                            saleprice.priceWithUtility ?? 0,
                            'VES',
                          )}
                        />
                        <DetailItem
                          label="Cin Impuesto"
                          value={formatCurrency(
                            saleprice.finalPrice ?? 0,
                            'VES',
                          )}
                        />
                      </div>
                    </div>
                  )}
                  {productData?.profitSupply && (
                    <div className="mt-4">
                      <h4 className="font-semibold">Precio de Oferta</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                        <DetailItem
                          label="Costo Producto"
                          value={formatCurrency(calculatedCostTixed, 'VES')}
                        />
                        <DetailItem label="Utilidad" value={`${utilOffer}%`} />
                        <DetailItem label="% Gastos" value={`${expense}%`} />
                        <DetailItem
                          label="Sin Impuesto"
                          value={formatCurrency(
                            offerPrice.priceWithUtility ?? 0,
                            'VES',
                          )}
                        />
                        <DetailItem
                          label="Cin Impuesto"
                          value={formatCurrency(
                            offerPrice.finalPrice ?? 0,
                            'VES',
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
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
