'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
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
import { ScrollArea } from '@repo/shadcn/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useSuppliersAll } from '../../suppliers/hooks/use-query-suppliers';
import { usePurchaseOrderMutation } from '../hooks/use-mutation-purchase-order';
import {
  PURCHASE_TYPES,
  PurchaseTypeEnum,
  purchaseItemTypeEnum,
} from '../schemas/purchase-order-options';

import { useEffect } from 'react';

import { useFixedAssetsAll } from '../../inventory/fixed-assets/hooks/use-query-fixed-asset';
import { useProductsAll } from '../../inventory/products/hooks/use-query-product';

import { useSupplierInvoicesBySupplier } from '../../supplier-invoices/hooks/use-query-supplier-invoice';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<PurchaseOrder>;
  readOnly?: boolean;
}

import { PurchaseOrder, purchaseOrderSchema } from '../schemas/purchase-order.schema';

export function PurchaseOrderForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: FormProps) {
  const { mutate: savePurchaseOrder, isPending: isSaving } = usePurchaseOrderMutation();
  const { data: suppliers } = useSuppliersAll();
  const { data: products } = useProductsAll();
  const { data: fixedAssets } = useFixedAssetsAll();

  const form = useForm<PurchaseOrder>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      id: defaultValues?.id,
      supplierId: defaultValues?.supplierId,
      orderNumber: defaultValues?.orderNumber || '',
      orderDate: defaultValues?.orderDate
        ? new Date(defaultValues.orderDate)
        : new Date(),
      expectedDeliveryDate: defaultValues?.expectedDeliveryDate
        ? new Date(defaultValues.expectedDeliveryDate)
        : undefined,
      subtotal: defaultValues?.subtotal || 0,
      taxAmount: defaultValues?.taxAmount || 0,
      totalAmount: defaultValues?.totalAmount || 0,
      currencyCode: defaultValues?.currencyCode || 'USD',
      observations: defaultValues?.observations || '',
      items: defaultValues?.items || [],
      orderType: defaultValues?.orderType || PurchaseTypeEnum.CASH,
    },
    mode: 'onChange',
  });

  const supplierId = form.watch('supplierId');
  const orderType = form.watch('orderType');

  const { data: supplierInvoices } = useSupplierInvoicesBySupplier(supplierId, {
    enabled: supplierId !== undefined && orderType === PurchaseTypeEnum.CREDIT,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  useEffect(() => {
    if (!watchedItems || watchedItems.length === 0) {
      form.setValue('subtotal', 0);
      form.setValue('taxAmount', 0);
      form.setValue('totalAmount', 0);
      return;
    }

    const subtotal = watchedItems.reduce(
      (acc, item) =>
        acc + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      0,
    );
    const iva = subtotal * 0.16; // Assuming 16% IVA
    const total = subtotal + iva;

    form.setValue('subtotal', subtotal);
    form.setValue('taxAmount', iva);
    form.setValue('totalAmount', total);
  }, [watchedItems, form]);

  const onSubmit = async (data: PurchaseOrder) => {
    savePurchaseOrder(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        form.setError('root', {
          type: 'manual',
          message: error.message || 'Error al guardar la orden de compra',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 h-full p-4"
        >
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Proveedor</FormLabel>
                  <SelectSearchable
                    options={
                      suppliers?.map((item) => ({
                        value: item.id!.toString(),
                        label: `${item.name}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona un proveedor"
                    defaultValue={field.value?.toString()}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Orden</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha de la Orden</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedDeliveryDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha de Entrega Esperada</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Orden</FormLabel>
                  <SelectSearchable
                    options={Object.entries(PURCHASE_TYPES).map(
                      ([key, value]) => ({
                        value: key,
                        label: value,
                      }),
                    )}
                    onValueChange={(value) =>
                      field.onChange(value as PurchaseTypeEnum)
                    }
                    placeholder="Selecciona el tipo de orden"
                    defaultValue={field.value}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Moneda</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items</h3>
              {!readOnly && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        itemName: '',
                        description: '',
                        lineType: purchaseItemTypeEnum.EXPENSE,
                        quantity: 1,
                        unitCost: 0,
                        totalCost: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Gasto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        itemName: '',
                        description: '',
                        lineType: purchaseItemTypeEnum.SALES_INVENTORY,
                        quantity: 1,
                        unitCost: 0,
                        totalCost: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Producto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        itemName: '',
                        description: '',
                        lineType: purchaseItemTypeEnum.FIXED_ASSET,
                        quantity: 1,
                        unitCost: 0,
                        totalCost: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Activo Fijo
                  </Button>
                </div>
              )}
            </div>

            {fields.map((field, index) => {
              const itemType = form.watch(`items.${index}.lineType`);
              const quantity = form.watch(`items.${index}.quantity`);
              const unitCost = form.watch(`items.${index}.unitCost`);
              const totalCost = (quantity || 0) * (unitCost || 0);

              return (
                <div
                  key={field.id}
                  className="flex items-end gap-2 p-2 border rounded-md"
                >
                  {itemType === purchaseItemTypeEnum.SALES_INVENTORY ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Producto</FormLabel>
                          <SelectSearchable
                            options={
                              products?.map((p) => ({
                                value: p.id!.toString(),
                                label: p.name,
                              })) || []
                            }
                            onValueChange={(value) => {
                              const selectedProduct = products?.find(
                                (p) => p.id === Number(value),
                              );
                              if (selectedProduct) {
                                form.setValue(
                                  `items.${index}.productId`,
                                  selectedProduct.id,
                                );
                                form.setValue(
                                  `items.${index}.itemName`,
                                  selectedProduct.name,
                                );
                              }
                            }}
                            placeholder="Selecciona un producto"
                            defaultValue={field.value?.toString()}
                            disabled={readOnly}
                          />
                        </FormItem>
                      )}
                    />
                  ) : itemType === purchaseItemTypeEnum.FIXED_ASSET ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.fixedAssetId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Activo Fijo</FormLabel>
                          <SelectSearchable
                            options={
                              fixedAssets?.map((a) => ({
                                value: a.id.toString(),
                                label: a.name,
                              })) || []
                            }
                            onValueChange={(value) => {
                              const selectedAsset = fixedAssets?.find(
                                (a) => a.id === Number(value),
                              );
                              if (selectedAsset) {
                                form.setValue(
                                  `items.${index}.fixedAssetId`,
                                  selectedAsset.id,
                                );
                                form.setValue(
                                  `items.${index}.itemName`,
                                  selectedAsset.name,
                                );
                              }
                            }}
                            placeholder="Selecciona un activo fijo"
                            defaultValue={field.value?.toString()}
                            disabled={readOnly}
                          />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemName`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nombre del Item</FormLabel>
                          <FormControl>
                            <Input {...field} disabled={readOnly} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={readOnly} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem style={{ width: '100px' }}>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={readOnly} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.unitCost`}
                    render={({ field }) => (
                      <FormItem style={{ width: '120px' }}>
                        <FormLabel>Costo Unit.</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={readOnly} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormItem style={{ width: '120px' }}>
                    <FormLabel>Total</FormLabel>
                    <FormControl>
                      <Input type="text" value={totalCost} readOnly disabled />
                    </FormControl>
                  </FormItem>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {fields.length !== 0 && (
            <div className="flex justify-end border-t">
              <div className="w-1/3 space-y-2">
                <div className="flex justify-between mt-4">
                  <span className="font-semibold">Subtotal:</span>
                  <span>{form.getValues('subtotal').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">IVA (16%):</span>
                  <span>{form.getValues('taxAmount').toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t">
                  <span className="font-semibold">Total:</span>
                  <span>{form.getValues('totalAmount').toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="sticky bottom-0 w-full bg-background py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                {readOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
