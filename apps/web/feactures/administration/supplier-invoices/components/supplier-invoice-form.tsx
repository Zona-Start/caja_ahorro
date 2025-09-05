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
  PAYMENT_METHOD,
  PaymentMethodEnum,
  SUPPLIER_INVOICE_PAYMENT_TYPES,
  SupplierInvoicePaymentTypeEnum,
  SupplierInvoiceStatusEnum,
  purchaseItemTypeEnum,
} from '../schemas/supplier-invoice-options';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Switch } from '@repo/shadcn/switch';
import { useAccountingAccounts } from '../../../accounting/accounting-accounts/hooks/use-query-account-plan';
import { useBankAccountAll } from '../../../banks/bank-account/hooks/use-query-bank-account';
import { useFixedAssetAll } from '../../inventories/fixed-asset/hooks/use-query-fixed-asset';
import { useProductsAll } from '../../inventories/products/hooks/use-query-product';
import { useServicesAll } from '../../inventories/services/hooks/use-query-service';
import { usePurchaseOrdersForInvoice } from '../../purchase-orders/hooks/use-query-purchase-order';
import {
  useSupplierAvailableCredit,
  useSupplierInvoices,
  useSupplierInvoicesDraftPending,
} from '../hooks/use-query-supplier-invoice';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierInvoice>;
  readOnly?: boolean;
}

import { useQueryClient } from '@tanstack/react-query';
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
  const [currentStatus, setCurrentStatus] = useState(
    defaultValues?.status || SupplierInvoiceStatusEnum.DRAFT,
  );
  const [chargeAdvances, setChargeAdvances] = useState(false);
  const [isSupplierInvoice, SetIsSupplierInvoice] = useState(false);
  const { mutate: saveSupplierInvoice, isPending: isSaving } =
    useSupplierInvoiceMutation();
  const { data: suppliers } = useSupplierAll();
  const { data: products } = useProductsAll();
  const { data: services } = useServicesAll();
  const { data: fixedAssets } = useFixedAssetAll();
  const { data: accountingAccounts } = useAccountingAccounts();
  const { data: bankAccounts } = useBankAccountAll();
  const queryClient = useQueryClient();

  const form = useForm<SupplierInvoice>({
    resolver: zodResolver(supplierInvoiceSchema),
    defaultValues: {
      ...defaultValues,
      invoiceNumber: defaultValues?.invoiceNumber || '',
      controlNumber: defaultValues?.controlNumber || '',
      observations: defaultValues?.observations || '',
      paymentDescription: defaultValues?.paymentDescription || '',
      paymentBankReference: defaultValues?.paymentBankReference || '',
      paymentAmount: defaultValues?.paymentAmount || 0,
      paymentMethod:
        defaultValues?.paymentMethod || PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: defaultValues?.transactionDate
        ? new Date(defaultValues.transactionDate)
        : null,
      invoiceDate: defaultValues?.invoiceDate
        ? new Date(defaultValues.invoiceDate)
        : new Date(),
      dueDate: defaultValues?.dueDate ? new Date(defaultValues.dueDate) : null,
      items: defaultValues?.items || [],
      draftAppliedCredits: defaultValues?.draftAppliedCredits || [],
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
  const totalAmount = useWatch({
    control: form.control,
    name: 'totalAmount',
  });

  const appliedAdvances = useWatch({
    control: form.control,
    name: 'draftAppliedCredits',
  });

  const { data: advances } = useSupplierAvailableCredit(supplierId);

  const totalAppliedAdvance = useMemo(() => {
    return (
      appliedAdvances?.reduce(
        (acc, advance) => acc + (advance.amount || 0),
        0,
      ) || 0
    );
  }, [appliedAdvances]);

  const isPaymentDisabled = totalAppliedAdvance >= totalAmount;

  useEffect(() => {
    if (defaultValues?.draftAppliedCredits?.length) {
      setChargeAdvances(true);
    }
  }, [defaultValues]);

  useEffect(() => {
    if (chargePayment) {
      const remainingAmount = (totalAmount || 0) - totalAppliedAdvance;
      form.setValue('paymentAmount', remainingAmount > 0 ? remainingAmount : 0);
    }
  }, [chargePayment, totalAmount, totalAppliedAdvance, form]);

  useEffect(() => {
    if (paymentType === SupplierInvoicePaymentTypeEnum.CASH) {
      form.setValue('dueDate', new Date());
    }
  }, [paymentType, form]);

  const { data: purchaseOrders } = usePurchaseOrdersForInvoice({
    supplierId: supplierId,
    status: ['PENDING', 'RECEIVED'],
  });

  const { data: supplierInvoicesForDraft } =
    useSupplierInvoicesDraftPending(isSupplierInvoice);

  const { data: allSupplierInvoices } = useSupplierInvoices({
    supplierId: supplierId,
  });

  const purchaseOrderData = useMemo(() => {
    return Array.isArray(purchaseOrders?.data) ? purchaseOrders.data : [];
  }, [purchaseOrders]);

  const supplierInvoiceData = Array.isArray(supplierInvoicesForDraft?.data)
    ? supplierInvoicesForDraft.data
    : [];

  const filteredPurchaseOrders = purchaseOrderData.filter((order: any) => {
    const hasExistingInvoice =
      Array.isArray(supplierInvoiceData) &&
      supplierInvoiceData.some(
        (invoice: any) =>
          invoice.purchaseOrderId === order.id &&
          invoice.id !== defaultValues?.id &&
          (invoice.status === SupplierInvoiceStatusEnum.DRAFT ||
            invoice.status === SupplierInvoiceStatusEnum.PENDING),
      );

    if (hasExistingInvoice) {
      return false;
    }

    if (order.status === 'RECEIVED') {
      const invoicedQuantities = (allSupplierInvoices?.data || [])
        .filter(
          (inv: any) =>
            inv.purchaseOrderId === order.id &&
            inv.status !== SupplierInvoiceStatusEnum.DRAFT,
        )
        .flatMap((inv: any) => inv.items)
        .reduce((acc: any, item: any) => {
          const key = item.itemId || item.description;
          acc[key] = (acc[key] || 0) + Number(item.quantity);
          return acc;
        }, {});

      const hasRemainingItems = order.items.some((item: any) => {
        const key = item.itemId || item.description;
        const invoicedQty = invoicedQuantities[key] || 0;
        const remainingQty = Number(item.quantity || 0) - invoicedQty;
        return remainingQty > 0;
      });

      return hasRemainingItems;
    }

    return true;
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const {
    fields: advanceFields,
    append: appendAdvance,
    remove: removeAdvance,
  } = useFieldArray({
    control: form.control,
    name: 'draftAppliedCredits',
  });

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  useEffect(() => {
    if (supplierId) {
      SetIsSupplierInvoice(true);
    } else {
      SetIsSupplierInvoice(false);
    }
  }, [supplierId]);

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

  const initialPurchaseOrderId = useRef(defaultValues?.purchaseOrderId);

  useEffect(() => {
    if (purchaseOrderId && purchaseOrderData) {
      if (
        !defaultValues?.id ||
        purchaseOrderId !== initialPurchaseOrderId.current
      ) {
        const selectedOrder = purchaseOrderData.find(
          (order: any) => order.id === purchaseOrderId,
        );

        if (selectedOrder && selectedOrder.items) {
          const invoicedQuantities = (allSupplierInvoices?.data || [])
            .filter(
              (inv: any) =>
                inv.purchaseOrderId === purchaseOrderId &&
                inv.id !== defaultValues?.id &&
                inv.status !== SupplierInvoiceStatusEnum.DRAFT,
            )
            .flatMap((inv: any) => inv.items)
            .reduce((acc: any, item: any) => {
              const key = item.itemId || item.description;
              acc[key] = (acc[key] || 0) + Number(item.quantity);
              return acc;
            }, {});

          const newItems = selectedOrder.items
            .map((item: any) => {
              const key = item.itemId || item.description;
              const invoicedQty = invoicedQuantities[key] || 0;
              const remainingQty = Number(item.quantity || 0) - invoicedQty;

              if (remainingQty <= 0) return null;

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
                if (service) description = undefined;
              }

              return {
                description: description,
                lineType: item.lineType,
                quantity: remainingQty,
                unitCost: unitCost,
                totalLine: remainingQty * unitCost,
                itemId: item.itemId || null,
                expenseAccountId: item.expenseAccountId || null,
              };
            })
            .filter(Boolean); // Remove null items

          replace(newItems);
        }
      }
    } else if (!purchaseOrderId && !defaultValues?.id) {
      replace([]);
    }
  }, [
    purchaseOrderId,
    purchaseOrderData,
    allSupplierInvoices,
    replace,
    products,
    services,
    fixedAssets,
    defaultValues?.id,
    initialPurchaseOrderId,
  ]);
  console.log(form.formState.errors);
  const handleSave = (status: SupplierInvoiceStatusEnum) => {
    form.setValue('status', status);
    form.handleSubmit((data) => {
      const itemsWithoutIds = data.items.map((item: any) => {
        const { id, ...rest } = item;
        return rest;
      });

      const { supplierName, ...payloadWithoutId } = data;

      const payload = {
        ...payloadWithoutId,
        items: itemsWithoutIds,
        status,
        draftAppliedCredits: chargeAdvances ? data.draftAppliedCredits : [],
        paymentMethod: data.chargePayment ? data.paymentMethod : undefined,
        paymentDescription: data.chargePayment
          ? data.paymentDescription
          : undefined,
        paymentBankReference: data.chargePayment
          ? data.paymentBankReference
          : undefined,
        paymentAmount: data.paymentAmount ? data.paymentAmount : undefined,
        subtotal: Number(data.subtotal.toFixed(2)),
        taxAmount: Number(data.taxAmount.toFixed(2)),
      };

      saveSupplierInvoice(payload, {
        onSuccess: (result: any) => {
          const updatedInvoice = result?.data;
          if (!updatedInvoice) return;

          if (
            status === SupplierInvoiceStatusEnum.DRAFT ||
            status === SupplierInvoiceStatusEnum.PENDING
          ) {
            onSuccess?.();
          }

          // Invalidate queries to refresh lists
          queryClient.invalidateQueries({
            queryKey: ['purchase-orders-for-invoice'],
          });
          queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
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
                      filteredPurchaseOrders?.map((item: any) => ({
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
            {form.formState.errors.items && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.items.message}
              </p>
            )}
            <ScrollArea className="h-[250px] w-full rounded-md border p-4">
              {fields.map((field, index) => {
                const itemType = form.watch(`items.${index}.lineType`);
                const quantity = form.watch(`items.${index}.quantity`);
                const unitCost = form.watch(`items.${index}.unitCost`);
                const totalLine = (quantity || 0) * (unitCost || 0);
                const itemError = form.formState.errors.items?.[index];

                return (
                  <div
                    key={field.id}
                    className="flex items-end gap-2 p-2 border rounded-md mb-2"
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
                                  form.trigger(`items.${index}.itemId`);
                                }
                              }}
                              placeholder="Selecciona un producto"
                              defaultValue={field.value?.toString()}
                              disabled={readOnly}
                              error={itemError?.itemId?.message}
                            />
                            <FormMessage>
                              {itemError?.itemId?.message}
                            </FormMessage>
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
                                  form.trigger(`items.${index}.itemId`);
                                }
                              }}
                              placeholder="Selecciona un activo fijo"
                              defaultValue={field.value?.toString()}
                              disabled={readOnly}
                              error={itemError?.itemId?.message}
                            />
                            <FormMessage>
                              {itemError?.itemId?.message}
                            </FormMessage>
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
                                  form.trigger(`items.${index}.itemId`);
                                }
                              }}
                              placeholder="Selecciona un servicio"
                              defaultValue={field.value?.toString()}
                              disabled={readOnly}
                              error={itemError?.itemId?.message}
                            />
                            <FormMessage>
                              {itemError?.itemId?.message}
                            </FormMessage>
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
                                    form.trigger(`items.${index}.itemId`);
                                  }
                                }}
                                placeholder="Selecciona un servicio"
                                defaultValue={field.value?.toString()}
                                disabled={readOnly}
                                error={itemError?.itemId?.message}
                              />
                              <FormMessage>
                                {itemError?.itemId?.message}
                              </FormMessage>
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
                              <Input
                                {...field}
                                value={field.value ?? ''}
                                disabled={readOnly}
                              />
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
                              disabled={readOnly}
                            />
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
                            <Input
                              type="number"
                              {...field}
                              disabled={readOnly}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormItem style={{ width: '120px' }}>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={totalLine}
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
            <div className="flex justify-end border-t">
              <div className="w-1/3 space-y-2">
                <div className="flex justify-between mt-4">
                  <span className="font-semibold">Subtotal:</span>
                  <span>
                    {Number(form.getValues('subtotal') || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">IVA (16%):</span>
                  <span>
                    {Number(form.getValues('taxAmount') || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t">
                  <span className="font-semibold">Total:</span>
                  <span>
                    {Number(form.getValues('totalAmount') || 0).toFixed(2)}
                  </span>
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

          <div className="space-y-4 border p-4 rounded-md">
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <FormLabel>Cargar Créditos Proveedor</FormLabel>
              <FormControl>
                <Switch
                  checked={chargeAdvances}
                  onCheckedChange={(checked) => {
                    setChargeAdvances(checked);
                    if (!checked) {
                      form.setValue('draftAppliedCredits', []);
                    }
                  }}
                  disabled={readOnly || !supplierId}
                />
              </FormControl>
            </FormItem>
            {chargeAdvances && (
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {advances?.data &&
                advances.data.flatMap((sc) => sc.credits).length > 0 ? (
                  advances.data
                    .flatMap((supplierCredit) => supplierCredit.credits)
                    .map((credit: any) => {
                      const advanceIndex = advanceFields.findIndex(
                        (field) => field.cxpId === credit.cxpId,
                      );
                      const isSelected = advanceIndex !== -1;

                      return (
                        <div
                          key={credit.cxpId}
                          className="flex items-center justify-between p-2 mb-2 border rounded-md"
                        >
                          <div className="flex items-center gap-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  appendAdvance({
                                    cxpId: credit.cxpId,
                                    amount: 0,
                                    origin: credit.origin,
                                    cxpNumber: credit.cxpNumber,
                                  });
                                } else {
                                  removeAdvance(advanceIndex);
                                }
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {credit.cxpNumber}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {credit.origin === 'ADVANCE'
                                  ? 'AVANCE'
                                  : 'NOTA CREDITO'}{' '}
                                - Saldo: {Number(credit.amount).toFixed(2)} Bs.
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <FormField
                              control={form.control}
                              name={`draftAppliedCredits.${advanceIndex}.amount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Monto a aplicar</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      max={credit.amount}
                                      min={0}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center text-muted-foreground">
                    No hay anticipos o créditos disponibles para este proveedor.
                  </div>
                )}
              </ScrollArea>
            )}
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
                        disabled={readOnly || isPaymentDisabled}
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
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Método de Pago</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={String(field.value)}
                          disabled={readOnly}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccione un método de pago" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="w-full min-w-[200px]">
                            {Object.entries(PAYMENT_METHOD).map(
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
                    name="transactionDate"
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Fecha de Transacción</FormLabel>
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

                  <FormField
                    control={form.control}
                    name="paymentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            // Convert the string value to a number on change
                            onChange={field.onChange}
                            value={field.value ?? 0} // Add this line
                            disabled={readOnly}
                          />
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

              {!readOnly &&
                currentStatus === SupplierInvoiceStatusEnum.DRAFT && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving || !supplierId}
                    onClick={() => handleSave(SupplierInvoiceStatusEnum.DRAFT)}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Borrador'}
                  </Button>
                )}

              {!readOnly &&
                currentStatus === SupplierInvoiceStatusEnum.DRAFT && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSaving || !supplierId}
                    onClick={() =>
                      handleSave(SupplierInvoiceStatusEnum.PENDING)
                    }
                  >
                    {isSaving ? 'Validando...' : 'Validar'}
                  </Button>
                )}

              {!readOnly &&
                currentStatus === SupplierInvoiceStatusEnum.PENDING && (
                  <Button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      handleSave(SupplierInvoiceStatusEnum.PENDING)
                    }
                  >
                    {isSaving ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
