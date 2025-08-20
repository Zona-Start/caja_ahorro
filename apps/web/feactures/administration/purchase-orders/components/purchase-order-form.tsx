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
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { useFixedAssetAll } from '../../inventories/fixed-asset/hooks/use-query-fixed-asset';
import { useProductsAll } from '../../inventories/products/hooks/use-query-product';
import { useServicesAll } from '../../inventories/services/hooks';
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { usePurchaseOrderMutation } from '../hooks/use-mutation-purchase-order';
import {
  PURCHASE_ITEM_TYPE_OPTIONS,
  PurchaseTypeEnum,
} from '../schemas/purchase-order-options';
import {
  PurchaseOrder,
  purchaseOrderSchema,
} from '../schemas/purchase-order.schema';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<PurchaseOrder>;
  readOnly?: boolean;
}

export function PurchaseOrderForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: FormProps) {
  const { mutate: savePurchaseOrder, isPending: isSaving } =
    usePurchaseOrderMutation();
  const { data: suppliers } = useSupplierAll();
  const { data: products } = useProductsAll();
  const { data: fixedAssets } = useFixedAssetAll();
  const { data: services } = useServicesAll();

  const { generalConfig } = useSystemConfigStore();

  const [itemTypeSelector, setItemTypeSelector] = useState(
    PurchaseTypeEnum.MANUAL,
  );

  const purchaseTaxRate = useMemo(() => {
    const ivaConfig = generalConfig.find((g: any) => g.key === 'iva_compra');
    return ivaConfig ? parseFloat(ivaConfig.value) / 100 : 0;
  }, [generalConfig]);

  const form = useForm<PurchaseOrder>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      ...defaultValues,
      orderType: defaultValues?.orderType || PurchaseTypeEnum.MANUAL,
      orderDate: defaultValues?.orderDate
        ? new Date(defaultValues.orderDate)
        : new Date(),
      items: defaultValues?.items || [],
    },
    mode: 'onSubmit',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });
  const watchedOrderType = useWatch({
    control: form.control,
    name: 'orderType',
  });

  useEffect(() => {
    const subtotal = watchedItems.reduce(
      (acc, item) =>
        acc + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      0,
    );
    const taxAmount = subtotal * purchaseTaxRate;
    const total = subtotal + taxAmount;

    form.setValue('subtotal', subtotal);
    form.setValue('taxAmount', taxAmount);
    form.setValue('totalAmount', total);
  }, [watchedItems, purchaseTaxRate, form]);

  const onSubmit = async (data: PurchaseOrder) => {
    const itemsWithoutTotalCost = data.items.map((item) => {
      const { totalCost, ...itemWithoutTotal } = item;
      return itemWithoutTotal;
    });

    const payload = {
      ...data,
      items: itemsWithoutTotalCost,
    };

    console.log(form.formState.errors);
    console.log(payload);
    savePurchaseOrder(payload, {
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
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
                    key={field.value}
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
              name="orderType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Orden</FormLabel>
                  <SelectSearchable
                    key={itemTypeSelector}
                    options={PURCHASE_ITEM_TYPE_OPTIONS}
                    onValueChange={(value) => {
                      field.onChange(value); // Pasa el valor a react-hook-form
                      setItemTypeSelector(
                        (value as PurchaseTypeEnum) ?? PurchaseTypeEnum.MANUAL,
                      ); // Llama a tu función con el nuevo valor
                    }}
                    placeholder="Selecciona el tipo de orden"
                    defaultValue={field.value as PurchaseTypeEnum}
                    disabled={readOnly}
                  />
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
              name="observations"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly}
                    />
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
                    disabled={
                      itemTypeSelector !== PurchaseTypeEnum.EXPENSE &&
                      itemTypeSelector !== PurchaseTypeEnum.MANUAL
                    }
                    onClick={() =>
                      append({
                        itemName: '',
                        description: '',
                        lineType: PurchaseTypeEnum.EXPENSE,
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
                    disabled={
                      itemTypeSelector !== PurchaseTypeEnum.SALES_INVENTORY &&
                      itemTypeSelector !== PurchaseTypeEnum.MANUAL
                    }
                    onClick={() =>
                      append({
                        itemName: '',
                        lineType: PurchaseTypeEnum.SALES_INVENTORY,
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
                    disabled={
                      itemTypeSelector !== PurchaseTypeEnum.FIXED_ASSET &&
                      itemTypeSelector !== PurchaseTypeEnum.MANUAL
                    }
                    onClick={() =>
                      append({
                        itemName: '',
                        lineType: PurchaseTypeEnum.FIXED_ASSET,
                        quantity: 1,
                        unitCost: 0,
                        totalCost: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Activo Fijo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      itemTypeSelector !== PurchaseTypeEnum.SERVICE &&
                      itemTypeSelector !== PurchaseTypeEnum.MANUAL
                    }
                    onClick={() =>
                      append({
                        itemName: '',
                        lineType: PurchaseTypeEnum.SERVICE,
                        quantity: 1,
                        unitCost: 0,
                        totalCost: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Servicio
                  </Button>
                </div>
              )}
            </div>
            <ScrollArea className="h-[250px] w-full rounded-md border p-4">
              {fields.map((field, index) => {
                const itemType = form.watch(`items.${index}.lineType`);
                const quantity = form.watch(`items.${index}.quantity`);
                const unitCost = form.watch(`items.${index}.unitCost`);
                const totalCost = (quantity || 0) * (unitCost || 0);

                return (
                  <div
                    key={field.id}
                    className="flex items-end gap-2 p-2 border rounded-md mb-2"
                  >
                    {itemType === PurchaseTypeEnum.SALES_INVENTORY ? (
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Producto</FormLabel>
                            <SelectSearchable
                              key={field.value}
                              options={
                                products?.map((p) => ({
                                  value: p.id!.toString(),
                                  label: p.name,
                                })) || []
                              }
                              onValueChange={(value) => {
                                field.onChange(Number(value));
                                const selectedProduct = products?.find(
                                  (p) => p.id === Number(value),
                                );
                                if (selectedProduct) {
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : itemType === PurchaseTypeEnum.FIXED_ASSET ? (
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Activo Fijo</FormLabel>
                            <SelectSearchable
                              key={field.value}
                              options={
                                fixedAssets?.map((a) => ({
                                  value: a.id.toString(),
                                  label: a.name,
                                })) || []
                              }
                              onValueChange={(value) => {
                                field.onChange(Number(value));
                                const selectedAsset = fixedAssets?.find(
                                  (a) => a.id === Number(value),
                                );
                                if (selectedAsset) {
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : itemType === PurchaseTypeEnum.SERVICE ? (
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Servicio</FormLabel>
                            <SelectSearchable
                              key={field.value}
                              options={
                                services?.map((s: any) => ({
                                  value: s.id!.toString(),
                                  label: s.name,
                                })) || []
                              }
                              onValueChange={(value) => {
                                field.onChange(Number(value));
                                const selectedService = services?.find(
                                  (s: any) => s.id === Number(value),
                                );
                                if (selectedService) {
                                  form.setValue(
                                    `items.${index}.itemName`,
                                    selectedService.name,
                                  );
                                }
                              }}
                              placeholder="Selecciona un servicio"
                              defaultValue={field.value?.toString()}
                              disabled={readOnly}
                            />
                            <FormMessage />
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
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {itemType === PurchaseTypeEnum.EXPENSE && (
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem style={{ width: '100px' }}>
                          <FormLabel>Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  parseInt(e.target.value, 10) || 0,
                                )
                              }
                              disabled={readOnly}
                            />
                          </FormControl>
                          <FormMessage />
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
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                              disabled={readOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem style={{ width: '120px' }}>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={totalCost.toFixed(2)}
                          readOnly
                          disabled
                        />
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
            </ScrollArea>
          </div>

          {fields.length !== 0 && (
            <div className="flex justify-end border-t pt-4">
              <div className="w-1/3 space-y-2">
                <div className="flex justify-between mt-4">
                  <span className="font-semibold">Subtotal:</span>
                  <span>{form.getValues('subtotal').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">
                    Impuesto ({purchaseTaxRate * 100}%):
                  </span>
                  <span>
                    {form.getValues('taxAmount')?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t">
                  <span className="font-semibold">Total:</span>
                  <span>{form.getValues('totalAmount').toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
