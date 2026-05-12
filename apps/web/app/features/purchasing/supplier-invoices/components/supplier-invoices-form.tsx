import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
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
import { Textarea } from '@repo/shadcn/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useSaveSupplierInvoiceMutation } from '../hooks/use-supplier-invoices-mutations';
import {
  usePurchaseOrdersForInvoiceQuery,
  useSuppliersAllQuery,
} from '../hooks/use-supplier-invoices-queries';
import type { SupplierInvoiceMutation } from '../schemas/supplier-invoice.schema';
import {
  supplierInvoiceFormSchema,
  type SupplierInvoiceForm,
} from '../schemas/supplier-invoice.schema';
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  LINE_TYPE_LABELS,
} from '../schemas/supplier-invoice-options';

interface SupplierInvoicesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierInvoiceMutation>;
  disabled?: boolean;
}

function toFormValues(
  data: Partial<SupplierInvoiceMutation>,
): SupplierInvoiceForm {
  return {
    supplierId: data.supplierId ?? (0 as unknown as number),
    purchaseOrderId: data.purchaseOrderId ?? null,
    invoiceNumber: data.invoiceNumber ?? '',
    controlNumber: data.controlNumber ?? '',
    invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
    dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
    subtotal: data.subtotal ?? 0,
    taxAmount: data.taxAmount ?? 0,
    totalAmount: data.totalAmount ?? 0,
    paymentType: data.paymentType ?? 'CASH',
    status: data.status ?? 'DRAFT',
    observations: data.observations ?? '',
    items: data.items?.map((item) => ({
      lineType: item.lineType ?? 'PRODUCT',
      itemId: item.itemId ?? null,
      expenseAccountId: item.expenseAccountId ?? null,
      description: item.description ?? '',
      quantity: item.quantity ?? 1,
      unitCost: item.unitCost ?? 0,
      totalLine: item.totalLine ?? 0,
    })) ?? [{ lineType: 'PRODUCT' as const, itemId: null, expenseAccountId: null, description: '', quantity: 1, unitCost: 0, totalLine: 0 }],
  };
}

export function SupplierInvoicesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: SupplierInvoicesFormProps) {
  const { mutate: saveInvoice, isPending: isSaving } =
    useSaveSupplierInvoiceMutation();

  const formDefaults = toFormValues(defaultValues ?? {});

  const form = useForm<SupplierInvoiceForm>({
    resolver: zodResolver(supplierInvoiceFormSchema),
    defaultValues: formDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedSupplierId = useWatch({ control: form.control, name: 'supplierId' });

  const { data: suppliers = [] } = useSuppliersAllQuery();
  const { data: purchaseOrders = [] } = usePurchaseOrdersForInvoiceQuery(
    watchedSupplierId,
  );

  const watchedItems = useWatch({ control: form.control, name: 'items' });

  const recalcTotals = () => {
    const items = form.getValues('items');
    const subtotal = items.reduce((sum, item) => sum + (Number(item.unitCost) || 0) * (Number(item.quantity) || 0), 0);
    const taxAmount = Number(form.getValues('taxAmount')) || 0;
    form.setValue('subtotal', subtotal);
    form.setValue('totalAmount', subtotal + taxAmount);
  };

  const onSubmit = (data: SupplierInvoiceForm) => {
    saveInvoice(data, {
      onSuccess: () => onSuccess?.(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select
                  disabled={disabled}
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => {
                    field.onChange(Number(v));
                    form.setValue('purchaseOrderId', null);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
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
            name="purchaseOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden de Compra</FormLabel>
                <Select
                  disabled={disabled || !watchedSupplierId}
                  value={field.value ? String(field.value) : ''}
                  onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar orden" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={String(po.id)}>
                        {po.orderNumber}
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
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Factura</FormLabel>
                <FormControl>
                  <Input placeholder="N° factura" {...field} disabled={disabled} />
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
                  <Input placeholder="N° control" {...field} value={field.value ?? ''} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoiceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Factura</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={disabled}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Vencimiento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={disabled}
                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Pago</FormLabel>
                <Select
                  disabled={disabled}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PAYMENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  disabled={disabled}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(INVOICE_STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Ítems de la Factura</h4>
            {!disabled && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    lineType: 'PRODUCT',
                    itemId: null,
                    expenseAccountId: null,
                    description: '',
                    quantity: 1,
                    unitCost: 0,
                    totalLine: 0,
                  })
                }
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar Ítem
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start border rounded-md p-3"
              >
                <FormField
                  control={form.control}
                  name={`items.${index}.lineType`}
                  render={({ field: f }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Tipo</FormLabel>
                      <Select
                        disabled={disabled}
                        value={f.value}
                        onValueChange={f.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(LINE_TYPE_LABELS).map(([k, l]) => (
                            <SelectItem key={k} value={k}>
                              {l}
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
                  name={`items.${index}.description`}
                  render={({ field: f }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel className="text-xs">Descripción</FormLabel>
                      <FormControl>
                        <Input className="h-8 text-xs" placeholder="Descripción" {...f} disabled={disabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field: f }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel className="text-xs">Cant.</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          step="0.01"
                          {...f}
                          disabled={disabled}
                          onChange={(e) => {
                            f.onChange(e.target.valueAsNumber || 0);
                            const unitCost = form.getValues(`items.${index}.unitCost`);
                            form.setValue(`items.${index}.totalLine`, (e.target.valueAsNumber || 0) * (Number(unitCost) || 0));
                            recalcTotals();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.unitCost`}
                  render={({ field: f }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Costo Unit.</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          step="0.01"
                          {...f}
                          disabled={disabled}
                          onChange={(e) => {
                            f.onChange(e.target.valueAsNumber || 0);
                            const qty = form.getValues(`items.${index}.quantity`);
                            form.setValue(`items.${index}.totalLine`, (e.target.valueAsNumber || 0) * (Number(qty) || 0));
                            recalcTotals();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.totalLine`}
                  render={({ field: f }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-xs">Total Línea</FormLabel>
                      <FormControl>
                        <Input
                          className="h-8 text-xs"
                          type="number"
                          step="0.01"
                          {...f}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!disabled && fields.length > 1 && (
                  <div className="md:col-span-1 flex items-end justify-center h-full pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
          <FormField
            control={form.control}
            name="subtotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subtotal</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="taxAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impuesto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    disabled={disabled}
                    onChange={(e) => {
                      field.onChange(e.target.valueAsNumber || 0);
                      recalcTotals();
                    }}
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
                <FormLabel>Total</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observaciones de la factura"
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabled}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          {disabled ? (
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
