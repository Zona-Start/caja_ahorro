import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Label } from '@repo/shadcn/components/ui/label';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/shadcn/components/ui/tabs';
import { Textarea } from '@repo/shadcn/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useForm } from 'react-hook-form';
import { useInventoryCategoriesAll } from '../../inventory-categories/hooks/use-query-inventory-categories';
import { useProductMutation } from '../hooks/use-mutation-product';
import { PRODUCT_STATUS_TYPES } from '../schemas/product-options';
import { Product, productSchema } from '../schemas/product.schema';

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
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Product>;
  readOnly?: boolean;
}

export default function ProductForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: Props) {
  const { mutate: saveProduct, isPending: isSaving } = useProductMutation();

  const { data: dataCategory } = useInventoryCategoriesAll('PRODUCT');

  const form = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...defaultValues,
      id: defaultValues?.id ?? undefined,
      unitType: defaultValues?.unitType ?? 'UNIT',
      purchaseTax: defaultValues?.purchaseTax
        ? Math.round(defaultValues.purchaseTax)
        : 12,
      saleTax: defaultValues?.saleTax ?? 16,
      baseCost: defaultValues?.baseCost
        ? parseFloat(Number(defaultValues.baseCost).toFixed(2))
        : 0.0,
      otherCosts: defaultValues?.otherCosts
        ? parseFloat(Number(defaultValues.otherCosts).toFixed(2))
        : 0.0,
      stockMin: defaultValues?.stockMin ?? 0,
      stockMax: defaultValues?.stockMax ?? 0,
      reorderPoint: defaultValues?.reorderPoint ?? 0,
      categoryId: defaultValues?.categoryId ?? undefined,
      profitSupply: defaultValues?.profitSupply ?? 0,
      profitSale: defaultValues?.profitSale ?? 30,
    },
    mode: 'onChange',
  });
  /* 
  console.log(form.formState.errors); */

  const onSubmit = async (data: Product) => {
    saveProduct(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el producto',
        });
      },
    });
  };

  const { generalConfig } = useSystemConfigStore();
  const configPurchaseTax = generalConfig.filter(
    (item) => item.key === 'GASTO-PRODUCTO',
  );

  const taxFromConfig = Number(configPurchaseTax[0]?.value) || 0;

  // Calcular costo calculado automáticamente
  const baseCost = form.watch('baseCost');
  const otherCosts = form.watch('otherCosts');
  const purchaseTax = form.watch('purchaseTax');
  const calculatedCost = Number(baseCost) + Number(otherCosts); // Ejemplo de cálculo
  const calculatedCostTixed =
    calculatedCost * (1 + (Number(purchaseTax) ?? 0) / 100); // Ejemplo de cálculo

  //calcular precio de venta
  const utilSale = form.watch('profitSale'); //utilidad en porcentaje
  const utilOffer = form.watch('profitSupply'); //utilidad oferta en porcentaje
  const expense = taxFromConfig; //gastos administrativos en porcentaje
  const saleTax = form.watch('saleTax'); //I.V.A. venta en porcentaje

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

  //inventario
  const currentStock = 10;
  const committedStock = 1;
  const orderedStock = 10;
  const availableStock = currentStock - committedStock;

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Información General</TabsTrigger>
              <TabsTrigger value="stock">Existencias</TabsTrigger>
              {/* <TabsTrigger value="suppliers">Proveedores</TabsTrigger> */}
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={String(field.value)}
                        disabled={readOnly}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                          {dataCategory?.map((item: any) => (
                            <SelectItem
                              key={item.id}
                              value={item.id!.toString()}
                              disabled={readOnly}
                              className={readOnly ? 'bg-muted' : ''}
                            >
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={readOnly}
                          className={readOnly ? 'bg-muted' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ''}
                          disabled={readOnly}
                          className={readOnly ? 'bg-muted' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div
                className={`grid grid-cols-1 ${defaultValues?.id ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}
              >
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={readOnly}
                          className={readOnly ? 'bg-muted' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          disabled={readOnly}
                          className={readOnly ? 'bg-muted' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {defaultValues?.id && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Estatus</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={String(field.value)}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-full min-w-[200px]">
                            {Object.entries(PRODUCT_STATUS_TYPES).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Configuración */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-lg">Configuración</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="unitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UNIT">UNIDAD</SelectItem>
                            <SelectItem value="KILOGRAM">KILOGRAMO</SelectItem>
                            <SelectItem value="LITER">LITRO</SelectItem>
                            <SelectItem value="METER">METRO</SelectItem>
                            <SelectItem value="BOX">CAJA</SelectItem>
                            <SelectItem value="PACK">PAQUETE</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="purchaseTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I.V.A. Compra</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseInt(e.target.value, 10) || 0,
                                )
                              }
                              disabled={readOnly}
                              className={
                                readOnly
                                  ? 'bg-muted rounded-r-none'
                                  : 'rounded-r-none'
                              }
                            />
                            <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm">
                              %
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="saleTax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>I.V.A. Venta</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  Number.parseFloat(e.target.value) || 0,
                                )
                              }
                              disabled={readOnly}
                              className={
                                readOnly
                                  ? 'bg-muted rounded-r-none'
                                  : 'rounded-r-none'
                              }
                            />
                            <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm">
                              %
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Costos */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-lg">Costos</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="baseCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">
                          Costo Proveedor
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onBlur={(e) => {
                              const value = parseFloat(String(field.value));
                              if (!isNaN(value)) {
                                form.setValue(
                                  field.name,
                                  parseFloat(value.toFixed(2)),
                                );
                              }
                              field.onBlur();
                            }}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={readOnly}
                            className={readOnly ? 'bg-muted ' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="otherCosts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Otros Costos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            value={field.value ?? ''}
                            onBlur={(e) => {
                              const value = parseFloat(String(field.value));
                              if (!isNaN(value)) {
                                form.setValue(
                                  field.name,
                                  parseFloat(value.toFixed(2)),
                                );
                              }
                              field.onBlur();
                            }}
                            onChange={(e) => field.onChange(e.target.value)}
                            disabled={readOnly}
                            className={readOnly ? 'bg-muted ' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <label className="text-xs font-medium">
                      Costo Sin Impuesto
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {calculatedCost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      Costo Con impuesto
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {calculatedCostTixed.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-lg">Precios</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-medium">
                      Costo Producto
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {calculatedCostTixed.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="profitSale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilidad</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={readOnly}
                                className={readOnly ? 'bg-muted ' : ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      Gastos Administrativos
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {expense} %
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Sin Impuesto</label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {saleprice.priceWithUtility.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Con impuesto</label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {saleprice.finalPrice.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-medium">Precio Oferta</label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {(utilOffer > 0 ? calculatedCostTixed : 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <FormField
                      control={form.control}
                      name="profitSupply"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utilidad</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    Number.parseFloat(e.target.value) || 0,
                                  )
                                }
                                disabled={readOnly}
                                className={readOnly ? 'bg-muted ' : ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">
                      Gastos Administrativos
                    </label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {expense} %
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Sin Impuesto</label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {(utilOffer > 0
                        ? offerPrice.priceWithUtility
                        : 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Con impuesto</label>
                    <div className="h-9 px-3 py-2 bg-muted border rounded-md text-sm">
                      {(utilOffer > 0 ? offerPrice.finalPrice : 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sección izquierda - Configuración de existencias */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-lg mb-4">Existencia</h3>

                    <div className="space-y-4">
                      {/* Existencia con Mínima y Máxima */}
                      <div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <Label className="text-sm font-medium text-center">
                            Mínima
                          </Label>
                          <Label className="text-sm font-medium text-center">
                            Máxima
                          </Label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="stockMin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock Mínimo</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    value={field.value ?? ''}
                                    disabled={readOnly}
                                    className={readOnly ? 'bg-muted' : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="stockMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock Máximo</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    value={field.value ?? ''}
                                    disabled={readOnly}
                                    className={readOnly ? 'bg-muted' : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Punto de Reorden */}
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <Label className="text-sm font-medium">
                          Punto de Reorden
                        </Label>
                        <div className="text-center">
                          <FormField
                            control={form.control}
                            name="reorderPoint"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(Number(e.target.value))
                                    }
                                    value={field.value ?? ''}
                                    disabled={readOnly}
                                    className={readOnly ? 'bg-muted' : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección derecha - Existencias Informativo */}
                {/* <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-lg">
                        Existencias (Informativo)
                      </h3>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">UNIDAD</span>
                      </div>
                    </div>

                    <div className="space-y-3"> */}
                {/* Actual */}
                {/* <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-sm font-medium">Actual</Label>
                        <div className="text-right">
                          <span className="font-mono text-sm">
                            {currentStock.toFixed(2)}
                          </span>
                        </div>
                      </div> */}

                {/* Comprometida */}
                {/* <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-sm font-medium">
                          Comprometida
                        </Label>
                        <div className="text-right">
                          <span className="font-mono text-sm text-muted-foreground">
                            {committedStock.toFixed(2)}
                          </span>
                        </div>
                      </div> */}

                {/* Ordenada */}
                {/* <div className="grid grid-cols-2 gap-4 items-center">
                        <Label className="text-sm font-medium">Ordenada</Label>
                        <div className="text-right">
                          <span className="font-mono text-sm text-muted-foreground">
                            {orderedStock.toFixed(2)}
                          </span>
                        </div>
                      </div> */}

                {/* Disponible */}
                {/* <div className="grid grid-cols-2 gap-4 items-center border-t pt-3">
                        <Label className="text-sm font-medium">
                          Disponible
                        </Label>
                        <div className="text-right">
                          <span className="font-mono text-sm font-medium">
                            {availableStock.toFixed(2)}
                          </span>
                        </div>
                      </div> */}
                {/* </div>
                  </div>
                </div> */}
              </div>
            </TabsContent>

            {/* <TabsContent value="suppliers" className="space-y-4 mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Información de proveedores disponible próximamente</p>
              </div>
            </TabsContent> */}
          </Tabs>

          <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cancelar
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving
                    ? 'Guardando...'
                    : defaultValues?.id
                      ? 'Actualizar'
                      : 'Guardar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
