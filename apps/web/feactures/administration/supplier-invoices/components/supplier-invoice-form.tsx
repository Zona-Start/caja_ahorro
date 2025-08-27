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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useSupplierInvoiceMutation } from '../hooks/use-mutation-supplier-invoice';
import {
  SUPPLIER_INVOICE_PAYMENT_TYPES,
  SupplierInvoicePaymentTypeEnum,
  SupplierInvoiceStatusEnum,
  purchaseItemTypeEnum,
} from '../schemas/supplier-invoice-options';

import { useEffect, useState } from 'react';

import { Switch } from '@repo/shadcn/switch';
import { useAccountingAccounts } from '../../../accounting/accounting-accounts/hooks/use-query-account-plan';
import { useBankAccountAll } from '../../../banks/bank-account/hooks/use-query-bank-account';
import { useFixedAssetAll } from '../../inventories/fixed-asset/hooks/use-query-fixed-asset';
import { useProductsAll } from '../../inventories/products/hooks/use-query-product';
import { useServicesAll } from '../../inventories/services/hooks/use-query-service';
import { usePurchaseOrders } from '../../purchase-orders/hooks/use-query-purchase-order';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierInvoice>;
  readOnly?: boolean;
}

import {
  SupplierInvoice,
  supplierInvoiceSchema,
} from '../schemas/supplier-invoice.schema';

export function SupplierInvoiceForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: FormProps) {
  const { mutate: saveSupplierInvoice, isPending: isSaving } =
    useSupplierInvoiceMutation();
  const { data: suppliers } = useSupplierAll();
  const { data: products } = useProductsAll();
  const { data: services } = useServicesAll();
  const { data: fixedAssets } = useFixedAssetAll();
  const { data: accountingAccounts } = useAccountingAccounts();
  const { data: bankAccounts } = useBankAccountAll();

  const [currentStatus, setCurrentStatus] = useState(defaultValues?.status);

  const form = useForm<SupplierInvoice>({
    resolver: zodResolver(supplierInvoiceSchema),
    defaultValues: {
      ...defaultValues,
      invoiceNumber: defaultValues?.invoiceNumber || '',
      controlNumber: defaultValues?.controlNumber || '',
      observations: defaultValues?.observations || '',
      paymentDescription: defaultValues?.paymentDescription || '',
      paymentBankReference: defaultValues?.paymentBankReference || '',
      invoiceDate: defaultValues?.invoiceDate
        ? new Date(defaultValues.invoiceDate)
        : new Date(),
      dueDate: defaultValues?.dueDate
        ? new Date(defaultValues.dueDate)
        : new Date(),
      items: defaultValues?.items || [],
      status: defaultValues?.status || SupplierInvoiceStatusEnum.DRAFT,
    },
    mode: 'onSubmit',
  });

  const supplierId = useWatch({ control: form.control, name: 'supplierId' });
  const paymentType = useWatch({ control: form.control, name: 'paymentType' });
  const purchaseOrderId = useWatch({
    control: form.control,
    name: 'purchaseOrderId',
  });
  const chargePayment = useWatch({
    control: form.control,
    name: 'chargePayment',
  });

  const { data: purchaseOrders } = usePurchaseOrders({
    supplierId: supplierId,
    status: 'PENDING',
  });

  const { fields, append, remove, replace } = useFieldArray({
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

  useEffect(() => {
    if (purchaseOrderId && purchaseOrders?.data) {
      const selectedOrder = purchaseOrders?.data?.find(
        (order: any) => order.id === purchaseOrderId,
      );

      if (selectedOrder && selectedOrder.items) {
        const newItems = selectedOrder.items.map((item: any) => {
          let description = item.description || '';
          let unitCost = Number(item.unitCost || 0);

          if (item.lineType === purchaseItemTypeEnum.SALES_INVENTORY) {
            const product = products?.find((p) => p.id === item.itemId);
            if (product) description = undefined;
          } else if (item.lineType === purchaseItemTypeEnum.FIXED_ASSET) {
            const asset = fixedAssets?.find((a) => a.id === item.itemId);
            if (asset) description = undefined;
          } else if (
            item.lineType === purchaseItemTypeEnum.SERVICE ||
            item.lineType === purchaseItemTypeEnum.SERVICE_EXPENSE
          ) {
            const service = services?.find((s) => s.id === item.itemId);
            if (service) {
              description = undefined;
              unitCost = Number(item.unitCost || 0);
            }
          }

          return {
            description: description,
            lineType: item.lineType,
            quantity: Number(item.quantity || 0),
            unitCost: unitCost,
            totalLine: Number(item.quantity || 0) * unitCost,
            itemId: item.itemId || null,
            expenseAccountId: item.expenseAccountId || null,
          };
        });
        replace(newItems);
      }
    } else {
      replace([]);
    }
  }, [
    purchaseOrderId,
    purchaseOrders,
    replace,
    products,
    services,
    fixedAssets,
  ]);

  const handleSave = (status: SupplierInvoiceStatusEnum) => {
    form.setValue('status', status);
    form.handleSubmit((data) => {
      const payload = {
        ...data,
        status,
        taxAmount: Number(data.taxAmount.toFixed(2)),
      };
      console.log(payload);

      saveSupplierInvoice(payload, {
        onSuccess: (result: any) => {
          const updatedInvoice = result?.data as SupplierInvoice;
          if (status === SupplierInvoiceStatusEnum.DRAFT) {
            onSuccess?.(); // Close modal on draft save
          } else if (status === SupplierInvoiceStatusEnum.PENDING) {
            // When validating, stay on the form and update status
            if (updatedInvoice) {
              setCurrentStatus(updatedInvoice.status);
              form.reset(updatedInvoice);
            }
          } else if (status === SupplierInvoiceStatusEnum.ACCOUNTED_FOR) {
            onSuccess?.(); // Close modal after accounting
          }
        },
        onError: (error) => {
          form.setError('root', {
            type: 'manual',
            message:
              error.message || 'Error al guardar la factura de proveedor',
          });
        },
      });
    })();
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form className="space-y-4 h-full p-4">
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
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                      form.resetField('purchaseOrderId');
                      replace([]);
                    }}
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
              name="purchaseOrderId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Orden de Compra</FormLabel>
                  <SelectSearchable
                    options={
                      purchaseOrders?.data?.map((item: any) => ({
                        value: item.id!.toString(),
                        label: `${item.orderNumber}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona una orden de compra"
                    defaultValue={field.value?.toString()}
                    disabled={readOnly || !supplierId}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Factura</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly || !supplierId} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="controlNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Control</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      disabled={readOnly || !supplierId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha de Factura</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={readOnly || !supplierId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Pago</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly || !supplierId}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un tipo de pago" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {Object.entries(SUPPLIER_INVOICE_PAYMENT_TYPES).map(
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
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha de Vencimiento</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={
                        readOnly ||
                        paymentType === SupplierInvoicePaymentTypeEnum.CASH ||
                        !supplierId
                      }
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
                    disabled={!supplierId}
                    onClick={() =>
                      append({
                        description: '',
                        lineType: purchaseItemTypeEnum.SALES_INVENTORY,
                        quantity: 1,
                        unitCost: 0,
                        totalLine: 0,
                        itemId: 0,
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
                    disabled={!supplierId}
                    onClick={() =>
                      append({
                        description: '',
                        lineType: purchaseItemTypeEnum.FIXED_ASSET,
                        quantity: 1,
                        unitCost: 0,
                        totalLine: 0,
                        itemId: 0,
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
                    disabled={!supplierId}
                    onClick={() =>
                      append({
                        description: '',
                        lineType: purchaseItemTypeEnum.SERVICE,
                        quantity: 1,
                        unitCost: 0,
                        totalLine: 0,
                        itemId: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Servicio
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!supplierId}
                    onClick={() =>
                      append({
                        description: '',
                        lineType: purchaseItemTypeEnum.EXPENSE,
                        quantity: 1,
                        unitCost: 0,
                        totalLine: 0,
                        itemId: 0,
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
                    disabled={!supplierId}
                    onClick={() =>
                      append({
                        description: '',
                        lineType: purchaseItemTypeEnum.SERVICE_EXPENSE,
                        quantity: 1,
                        unitCost: 0,
                        totalLine: 0,
                        itemId: 0,
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Anexar Servicio/Gasto
                  </Button>
                </div>
              )}
            </div>

            {fields.map((field, index) => {
              const itemType = form.watch(`items.${index}.lineType`);
              const quantity = form.watch(`items.${index}.quantity`);
              const unitCost = form.watch(`items.${index}.unitCost`);
              const totalLine = (quantity || 0) * (unitCost || 0);

              return (
                <div
                  key={field.id}
                  className="flex items-end gap-2 p-2 border rounded-md"
                >
                  {itemType === purchaseItemTypeEnum.SALES_INVENTORY ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemId`}
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
                                  `items.${index}.itemId`,
                                  selectedProduct.id,
                                );
                                form.setValue(
                                  `items.${index}.description`,
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
                      name={`items.${index}.itemId`}
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
                                  `items.${index}.itemId`,
                                  selectedAsset.id,
                                );
                                form.setValue(
                                  `items.${index}.description`,
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
                  ) : itemType === purchaseItemTypeEnum.SERVICE ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Servicio</FormLabel>
                          <SelectSearchable
                            options={
                              services?.map((s) => ({
                                value: s.id!.toString(),
                                label: s.name,
                              })) || []
                            }
                            onValueChange={(value) => {
                              const selectedService = services?.find(
                                (s) => s.id === Number(value),
                              );
                              if (selectedService) {
                                form.setValue(
                                  `items.${index}.itemId`,
                                  selectedService.id,
                                );
                                form.setValue(
                                  `items.${index}.description`,
                                  selectedService.name,
                                );
                                form.setValue(`items.${index}.unitCost`, 0);
                              }
                            }}
                            placeholder="Selecciona un servicio"
                            defaultValue={field.value?.toString()}
                            disabled={readOnly}
                          />
                        </FormItem>
                      )}
                    />
                  ) : itemType === purchaseItemTypeEnum.SERVICE_EXPENSE ? (
                    <>
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Servicio</FormLabel>
                            <SelectSearchable
                              options={
                                services?.map((s) => ({
                                  value: s.id!.toString(),
                                  label: s.name,
                                })) || []
                              }
                              onValueChange={(value) => {
                                const selectedService = services?.find(
                                  (s) => s.id === Number(value),
                                );
                                if (selectedService) {
                                  form.setValue(
                                    `items.${index}.itemId`,
                                    selectedService.id,
                                  );
                                  form.setValue(
                                    `items.${index}.description`,
                                    selectedService.name,
                                  );
                                  form.setValue(`items.${index}.unitCost`, 0);
                                }
                              }}
                              placeholder="Selecciona un servicio"
                              defaultValue={field.value?.toString()}
                              disabled={readOnly}
                            />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.expenseAccountId`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Cuenta Contable</FormLabel>
                            <SelectSearchable
                              options={
                                accountingAccounts?.data.map(
                                  (account: any) => ({
                                    value: account.id!.toString(),
                                    label: `${account.code} - ${account.name}`,
                                  }),
                                ) || []
                              }
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              defaultValue={field.value?.toString()}
                              disabled={readOnly}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
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
                  )}

                  {itemType === purchaseItemTypeEnum.EXPENSE && (
                    <FormField
                      control={form.control}
                      name={`items.${index}.expenseAccountId`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Cuenta Contable</FormLabel>
                          <SelectSearchable
                            options={
                              accountingAccounts?.data.map((account: any) => ({
                                value: account.id!.toString(),
                                label: `${account.code} - ${account.name}`,
                              })) || []
                            }
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
                            defaultValue={field.value?.toString()}
                            disabled={readOnly}
                          />
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
                      <Input type="text" value={totalLine} readOnly disabled />
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
                  <span>{(form.getValues('taxAmount') || 0).toFixed(2)}</span>
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
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      disabled={readOnly || !supplierId}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {paymentType === SupplierInvoicePaymentTypeEnum.CASH && (
            <div className="space-y-4 border p-4 rounded-md">
              <FormField
                control={form.control}
                name="chargePayment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <FormLabel>Cargar Pago</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={readOnly}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {chargePayment && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankAccountId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cuenta Bancaria</FormLabel>
                        <SelectSearchable
                          options={
                            bankAccounts?.data.map((item: any) => ({
                              value: item.id!.toString(),
                              label: `${item.accountName} - ${item.accountNumber}`,
                            })) || []
                          }
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          placeholder="Selecciona una cuenta bancaria"
                          defaultValue={field.value?.toString()}
                          disabled={readOnly}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción del Pago</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="paymentBankReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Referencia Bancaria</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={true} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
          )}
          <div className="sticky bottom-0 w-full bg-background py-4 px-6 mt-auto border-t">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cerrar
              </Button>

              {!readOnly && (currentStatus === 'DRAFT' || !currentStatus) && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => handleSave(SupplierInvoiceStatusEnum.DRAFT)}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Borrador'}
                </Button>
              )}

              {!readOnly && currentStatus === 'DRAFT' && defaultValues?.id && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => handleSave(SupplierInvoiceStatusEnum.PENDING)}
                >
                  {isSaving ? 'Validando...' : 'Validar'}
                </Button>
              )}

              {!readOnly && currentStatus === 'PENDING' && (
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={() =>
                    handleSave(SupplierInvoiceStatusEnum.ACCOUNTED_FOR)
                  }
                >
                  {isSaving ? 'Contabilizando...' : 'Contabilizar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
