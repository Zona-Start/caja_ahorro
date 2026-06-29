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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/shadcn/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/shadcn/popover';
import { Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { cn } from '@repo/shadcn/lib/utils';
import { useCreateMovementMutation, useUpdateMovementMutation } from '../hooks/use-movements-queries';
import {
  usePurchaseOrdersQuery,
  usePurchaseOrderQuery,
  useSupplierInvoicesQuery,
  useSupplierInvoiceQuery,
  useProductsAllQuery,
  useProductPriceQuery,
} from '../hooks/use-movements-resources';
import {
  type InventoryMovement,
  inventoryMovementSchema,
} from '../schemas/movements.schema';
import { MOVEMENT_TYPE_OPTIONS } from '../schemas/movements-options';
import type { z } from 'zod';

type FormValues = z.infer<typeof inventoryMovementSchema>;

interface MovementsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<InventoryMovement>;
  mode?: 'create' | 'edit';
}

const MOVEMENT_TYPE_ENTRIES = Object.entries(MOVEMENT_TYPE_OPTIONS);

export function MovementsForm({
  onSuccess,
  onCancel,
  defaultValues,
  mode = 'create',
}: MovementsFormProps) {
  const createMutation = useCreateMovementMutation();
  const updateMutation = useUpdateMovementMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<FormValues>({
    resolver: zodResolver(inventoryMovementSchema),
    defaultValues: {
      id: defaultValues?.id ?? undefined,
      movementType: defaultValues?.movementType ?? '',
      movementDate: defaultValues?.movementDate
        ? new Date(defaultValues.movementDate)
        : new Date(),
      description: defaultValues?.description ?? '',
      supplierId: defaultValues?.supplierId ?? undefined,
      invoiceNumber: defaultValues?.invoiceNumber ?? undefined,
      items: defaultValues?.items?.map((item) => ({
        productId: item.productId ?? '',
        productName: item.productName ?? '',
        productCode: item.productCode ?? '',
        quantity: item.quantity ?? 1,
        unitCost: item.unitCost ?? 0,
        totalCost: (item.quantity ?? 1) * (item.unitCost ?? 0),
      })) ?? [{ productId: '', productName: '', productCode: '', quantity: 1, unitCost: 0, totalCost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const movementType = useWatch({ control: form.control, name: 'movementType' });
  const items = useWatch({ control: form.control, name: 'items' });

  const totalItems = items?.length ?? 0;
  const totalCost = items?.reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unitCost ?? 0), 0) ?? 0;

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      items: data.items.map((item) => ({
        ...item,
        totalCost: (item.quantity ?? 0) * (item.unitCost ?? 0),
      })),
    } as InventoryMovement;
    if (mode === 'edit' && defaultValues?.id) {
      payload.id = defaultValues.id;
    }
    const mutation = mode === 'edit' ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => onSuccess?.(),
    });
  };

  // Purchase Order selector state
  const { data: purchaseOrders } = usePurchaseOrdersQuery();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { data: purchaseOrderDetail } = usePurchaseOrderQuery(
    selectedOrderId ?? '',
    !!selectedOrderId && movementType === 'PURCHASE_RECEIPT',
  );

  // Supplier Invoice selector state
  const { data: supplierInvoices } = useSupplierInvoicesQuery();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const { data: supplierInvoiceDetail } = useSupplierInvoiceQuery(
    selectedInvoiceId ?? '',
    !!selectedInvoiceId && movementType === 'SUPPLIER_RETURN',
  );

  // Preload items from selected purchase order
  useEffect(() => {
    if (purchaseOrderDetail?.items && purchaseOrderDetail.items.length > 0) {
      const newItems = purchaseOrderDetail.items.map((item) => ({
        productId: item.itemId ?? '',
        productName: '',
        productCode: '',
        quantity: item.quantity,
        unitCost: Number(item.unitCost ?? 0),
        totalCost: item.quantity * Number(item.unitCost ?? 0),
      }));
      form.setValue('items', newItems);
      if (purchaseOrderDetail.supplierId) {
        form.setValue('supplierId', purchaseOrderDetail.supplierId);
      }
    }
  }, [purchaseOrderDetail]);

  // Preload items from selected supplier invoice
  useEffect(() => {
    if (supplierInvoiceDetail?.items && supplierInvoiceDetail.items.length > 0) {
      const newItems = supplierInvoiceDetail.items.map((item) => ({
        productId: item.itemId ?? '',
        productName: '',
        productCode: '',
        quantity: item.quantity,
        unitCost: Number(item.unitCost ?? 0),
        totalCost: item.quantity * Number(item.unitCost ?? 0),
      }));
      form.setValue('items', newItems);
      if (supplierInvoiceDetail.supplierId) {
        form.setValue('supplierId', supplierInvoiceDetail.supplierId);
      }
    }
  }, [supplierInvoiceDetail]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <section>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-1">
            Encabezado
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimiento</FormLabel>
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v);
                      setSelectedOrderId(null);
                      setSelectedInvoiceId(null);
                      form.setValue('items', [{ productId: '', productName: '', productCode: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOVEMENT_TYPE_ENTRIES.map(([value, label]) => (
                        <SelectItem key={value} value={value}>
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
              name="movementDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {movementType === 'PURCHASE_RECEIPT' && (
            <div className="mt-4">
              <FormLabel className="mb-1 block">Orden de Compra</FormLabel>
              <Select
                value={selectedOrderId ?? ''}
                onValueChange={(v) => setSelectedOrderId(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar orden de compra..." />
                </SelectTrigger>
                <SelectContent>
                  {(purchaseOrders ?? []).map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.orderNumber} - {po.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Al seleccionar una orden se precargarán sus productos
              </p>
            </div>
          )}

          {movementType === 'SUPPLIER_RETURN' && (
            <div className="mt-4">
              <FormLabel className="mb-1 block">Factura Recibida</FormLabel>
              <Select
                value={selectedInvoiceId ?? ''}
                onValueChange={(v) => setSelectedInvoiceId(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar factura..." />
                </SelectTrigger>
                <SelectContent>
                  {(supplierInvoices ?? []).map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber || inv.supplierInvoiceNumber} - {inv.supplierName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Al seleccionar una factura se precargarán sus productos
              </p>
            </div>
          )}

          <div className="mt-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción / Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Motivo del movimiento..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 border-b pb-1">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Productos
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ productId: '', productName: '', productCode: '', quantity: 1, unitCost: 0, totalCost: 0 })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Agregar Producto
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <ProductItemRow
                key={field.id}
                index={index}
                form={form}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
              />
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-1">
            Resumen
          </h4>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Productos: </span>
              <span className="font-bold">{totalItems}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Costo Total: </span>
              <span className="font-bold">Bs. {totalCost.toFixed(2)}</span>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ProductItemRow({
  index,
  form,
  onRemove,
  canRemove,
}: {
  index: number;
  form: ReturnType<typeof useForm<FormValues>>;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: allProducts = [] } = useProductsAllQuery(searchOpen);

  const filtered = searchTerm
    ? allProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.internalCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : allProducts;

  const selectedProductId = form.watch(`items.${index}.productId`);
  const quantity = form.watch(`items.${index}.quantity`);
  const unitCost = form.watch(`items.${index}.unitCost`);

  const { data: productPrice } = useProductPriceQuery(
    selectedProductId ?? '',
    !!selectedProductId,
  );

  useEffect(() => {
    if (productPrice && selectedProductId) {
      const currentUnitCost = form.getValues(`items.${index}.unitCost` as never) as unknown as number;
      if (!currentUnitCost || currentUnitCost === 0) {
        form.setValue(`items.${index}.unitCost` as never, productPrice.baseCost as never, {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        });
      }
    }
  }, [productPrice, selectedProductId]);

  const qty = quantity ?? 0;
  const cost = unitCost ?? 0;
  const subtotal = qty * cost;

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          #{index + 1}
        </span>
        <div className="flex-1">
          <FormField
            control={form.control}
            name={`items.${index}.productId`}
            render={({ field: f }) => (
              <FormItem className="flex flex-col">
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-full justify-between',
                          !f.value && 'text-muted-foreground',
                        )}
                      >
                        {f.value
                          ? (form.watch(`items.${index}.productName`) ||
                             form.watch(`items.${index}.productCode`) ||
                             f.value)
                          : 'Buscar producto...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList>
                        <CommandEmpty>Sin resultados</CommandEmpty>
                        <CommandGroup>
                          {filtered.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              onSelect={() => {
                                f.onChange(p.id);
                                form.setValue(`items.${index}.productName` as never, p.name as never);
                                form.setValue(`items.${index}.productCode` as never, p.internalCode as never);
                                setSearchOpen(false);
                                setSearchTerm('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  p.id === f.value ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <span className="font-medium">{p.internalCode}</span>
                              <span className="ml-2 text-muted-foreground truncate">
                                {p.name}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-500"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={form.control}
          name={`items.${index}.quantity`}
          render={({ field: f }) => (
            <FormItem>
              <FormLabel className="text-xs">Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="numeric"
                  min="1"
                  placeholder="1"
                  value={f.value ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    f.onChange(raw === '' ? 0 : parseInt(raw, 10));
                  }}
                  onBlur={f.onBlur}
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
            <FormItem>
              <FormLabel className="text-xs">Costo Unitario</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  min="0"
                  placeholder="0.00"
                  value={f.value ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = raw.split('.');
                    const clean = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                    const num = clean === '' || clean === '.' ? 0 : parseFloat(clean);
                    f.onChange(isNaN(num) ? 0 : num);
                  }}
                  onBlur={f.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
          <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm items-center">
            Bs. {subtotal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
