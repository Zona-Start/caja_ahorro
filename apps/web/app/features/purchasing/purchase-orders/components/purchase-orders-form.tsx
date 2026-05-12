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
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/format-utils';
import { apiClient } from '@/lib/api-client';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  ORDER_STATUS_OPTIONS,
  LINE_TYPES,
  CURRENCY_CODES,
} from '../schemas/purchase-orders-options';
import {
  type PurchaseOrder,
  purchaseOrderSchema,
} from '../schemas/purchase-orders.schema';
import { usePurchaseOrderMutation } from '../hooks/use-purchase-orders-mutations';

interface PurchaseOrdersFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<PurchaseOrder>;
  readOnly?: boolean;
}

interface SupplierOption {
  id: number;
  name: string;
}

function toFormValues(data: Partial<PurchaseOrder> | undefined): Partial<PurchaseOrder> {
  if (!data) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value === null ? undefined : value;
  }
  if (data.orderDate && typeof data.orderDate === 'string') {
    sanitized.orderDate = new Date(data.orderDate);
  }
  if (
    data.expectedDeliveryDate &&
    typeof data.expectedDeliveryDate === 'string'
  ) {
    sanitized.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
  }
  return sanitized as Partial<PurchaseOrder>;
}

const emptyItem = {
  lineType: 'PRODUCT',
  itemId: '',
  description: '',
  quantity: 1,
  unitCost: 0,
  totalCost: 0,
};

export function PurchaseOrdersForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: PurchaseOrdersFormProps) {
  const { mutate: saveOrder, isPending: isSaving } =
    usePurchaseOrderMutation();

  const { data: suppliers, isLoading: suppliersLoading } = useQuery<
    SupplierOption[]
  >({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => {
      const response = await apiClient.get('/administration/suppliers/all');
      return response.data?.data ?? response.data ?? [];
    },
  });

  const form = useForm<PurchaseOrder>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: defaultValues?.supplierId ?? (0 as number),
      orderDate: defaultValues?.orderDate ?? new Date(),
      expectedDeliveryDate: defaultValues?.expectedDeliveryDate ?? new Date(),
      status: defaultValues?.status ?? 'DRAFT',
      currencyCode: defaultValues?.currencyCode ?? 'USD',
      subtotal: defaultValues?.subtotal ?? 0,
      taxAmount: defaultValues?.taxAmount ?? 0,
      totalAmount: defaultValues?.totalAmount ?? 0,
      observations: defaultValues?.observations ?? '',
      items: defaultValues?.items ?? [emptyItem],
      ...toFormValues(defaultValues),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchedItems = form.watch('items');
  const watchedTax = form.watch('taxAmount');

  useEffect(() => {
    const subtotal = (watchedItems || []).reduce(
      (sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)),
      0,
    );
    const tax = Number(watchedTax) || 0;
    form.setValue('subtotal', subtotal, { shouldValidate: false });
    form.setValue('totalAmount', subtotal + tax, { shouldValidate: false });
  }, [watchedItems, watchedTax, form]);

  const onSubmit = (data: PurchaseOrder) => {
    const computedItems = (data.items || []).map((item) => ({
      ...item,
      totalCost: (item.quantity || 0) * (item.unitCost || 0),
    }));
    const subtotal = computedItems.reduce((sum, i) => sum + i.totalCost, 0);
    const taxAmount = Number(data.taxAmount) || 0;
    const totalAmount = subtotal + taxAmount;

    const payload = {
      ...data,
      items: computedItems,
      subtotal,
      taxAmount,
      totalAmount,
      ...(defaultValues?.id ? { id: defaultValues.id } : {}),
    };

    saveOrder(payload, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  const getDateValue = (value: Date | string | undefined): string => {
    if (!value) return '';
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return value;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value ? String(field.value) : ''}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliersLoading ? (
                      <SelectItem value="0" disabled>
                        Cargando...
                      </SelectItem>
                    ) : (
                      suppliers?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
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
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
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
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Orden</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={getDateValue(field.value)}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
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
              <FormItem>
                <FormLabel>Fecha de Entrega Esperada</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={getDateValue(field.value)}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCY_CODES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Artículos / Servicios</h4>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append(emptyItem)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Agregar línea
              </Button>
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">Tipo</th>
                  <th className="px-2 py-2 text-left font-medium">Código</th>
                  <th className="px-2 py-2 text-left font-medium">
                    Descripción
                  </th>
                  <th className="px-2 py-2 text-right font-medium w-20">
                    Cantidad
                  </th>
                  <th className="px-2 py-2 text-right font-medium w-28">
                    Costo Unit.
                  </th>
                  <th className="px-2 py-2 text-right font-medium w-28">
                    Costo Total
                  </th>
                  {!readOnly && (
                    <th className="px-2 py-2 text-center w-10" />
                  )}
                </tr>
              </thead>
              <tbody>
                {fields.map((fieldItem, index) => (
                  <tr key={fieldItem.id} className="border-t">
                    <td className="px-2 py-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.lineType`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={readOnly}
                            >
                              <FormControl>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {LINE_TYPES.map((lt) => (
                                  <SelectItem key={lt.value} value={lt.value}>
                                    {lt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.itemId`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Código"
                                {...field}
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Descripción"
                                {...field}
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="1"
                                min="1"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitCost`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                className="h-8 text-xs text-right"
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                                disabled={readOnly}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-2 py-1 text-right text-xs">
                      {formatCurrency(
                        (watchedItems[index]?.quantity || 0) *
                          (watchedItems[index]?.unitCost || 0),
                        form.watch('currencyCode') as 'USD' | 'VES',
                      )}
                    </td>
                    {!readOnly && (
                      <td className="px-2 py-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td
                      colSpan={readOnly ? 6 : 7}
                      className="px-2 py-4 text-center text-muted-foreground text-sm"
                    >
                      No hay artículos agregados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {form.formState.errors.items?.root?.message && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.items.root.message}
            </p>
          )}
          {form.formState.errors.items?.message && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.items.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-md">
          <div className="text-sm">
            <span className="font-medium">Subtotal:</span>{' '}
            <span className="font-mono">
              {formatCurrency(
                form.watch('subtotal') || 0,
                form.watch('currencyCode') as 'USD' | 'VES',
              )}
            </span>
          </div>
          <FormField
            control={form.control}
            name="taxAmount"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="text-sm">Impuesto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="h-8 text-sm"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="text-sm">
            <span className="font-bold">Total:</span>{' '}
            <span className="font-mono font-bold">
              {formatCurrency(
                form.watch('totalAmount') || 0,
                form.watch('currencyCode') as 'USD' | 'VES',
              )}
            </span>
          </div>
        </div>

        <FormField
          control={form.control}
          name="observations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observaciones de la orden de compra"
                  className="resize-none"
                  {...field}
                  value={field.value ?? ''}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
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
    </Form>
  );
}
