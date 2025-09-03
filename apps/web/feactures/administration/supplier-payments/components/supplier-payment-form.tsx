'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/components/ui/form';
import { Input } from '@repo/shadcn/components/ui/input';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { Textarea } from '@repo/shadcn/components/ui/textarea';
import { Trash2 } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { useSupplierInvoicesBySupplier } from '../../supplier-invoices/hooks';
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useSupplierPaymentMutation } from '../hooks';
import { SupplierPayment, supplierPaymentSchema } from '../schemas';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierPayment>;
  readOnly?: boolean;
}

export function SupplierPaymentForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: FormProps) {
  const { mutate: savePayment, isPending: isSaving } =
    useSupplierPaymentMutation();
  const { data: suppliers } = useSupplierAll();

  const form = useForm<SupplierPayment>({
    resolver: zodResolver(supplierPaymentSchema),
    defaultValues: {
      ...defaultValues,
      lines: defaultValues?.lines || [],
    },
    mode: 'onSubmit',
  });

  const supplierId = useWatch({ control: form.control, name: 'supplierId' });
  const { data: invoices } = useSupplierInvoicesBySupplier(supplierId, {
    enabled: !!supplierId,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  });

  const watchedLines = useWatch({ control: form.control, name: 'lines' });

  // Calcular totales
  const totalAmount = watchedLines.reduce(
    (acc, line) => acc + (Number(line.amount) || 0),
    0,
  );

  const handleSave = () => {
    form.setValue('totalAmount', totalAmount);
    form.handleSubmit((data) => {
      savePayment(data, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    })();
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form className="space-y-4 h-full p-4">
          <FormField
            control={form.control}
            name="supplierId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Proveedor</FormLabel>
                <SelectSearchable
                  options={
                    suppliers?.map((s) => ({
                      value: s.id!.toString(),
                      label: s.name,
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

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Facturas a Pagar</h3>
            <div className="flex flex-col gap-2">
              {invoices?.data?.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span>
                    {invoice.invoiceNumber} - Vence:{' '}
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </span>
                  <span>Monto: {invoice.totalAmount}</span>
                  <Button
                    size="sm"
                    onClick={() =>
                      append({
                        accountsPayableId: invoice.id,
                        amount: invoice.totalAmount,
                        description: `Pago Factura ${invoice.invoiceNumber}`,
                      })
                    }
                  >
                    Agregar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Líneas del Pago</h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-end gap-2 p-2 border rounded-md mb-2"
                >
                  <FormField
                    control={form.control}
                    name={`lines.${index}.description`}
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
                  <FormField
                    control={form.control}
                    name={`lines.${index}.amount`}
                    render={({ field }) => (
                      <FormItem style={{ width: '150px' }}>
                        <FormLabel>Monto</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} disabled={readOnly} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
              ))}
            </ScrollArea>
          </div>

          <div className="flex justify-end border-t">
            <div className="w-1/3 space-y-2">
              <div className="flex justify-between font-bold text-lg border-t mt-4 pt-2">
                <span>Total a Pagar:</span>
                <span>{totalAmount.toFixed(2)}</span>
              </div>
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
                    {...field}
                    value={field.value || ''}
                    disabled={readOnly}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="sticky bottom-0 w-full bg-background py-4 px-6 mt-auto border-t">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                Cerrar
              </Button>
              {!readOnly && (
                <Button type="button" disabled={isSaving} onClick={handleSave}>
                  {isSaving ? 'Guardando...' : 'Guardar Pago'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
