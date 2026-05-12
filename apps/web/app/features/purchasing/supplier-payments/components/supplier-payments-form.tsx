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
import { useForm } from 'react-hook-form';
import { useSupplierPaymentPayMutation } from '../hooks/use-supplier-payments-mutations';
import {
  supplierPaymentPaySchema,
  type SupplierPaymentPay,
} from '../schemas/supplier-payment.schema';
import {
  PAYMENT_METHOD_LABELS,
  CURRENCY_CODE_LABELS,
} from '../schemas/supplier-payment-options';

interface SupplierPaymentsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierPaymentPay>;
  disabled?: boolean;
}

export function SupplierPaymentsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: SupplierPaymentsFormProps) {
  const { mutate: pay, isPending: isPaying } = useSupplierPaymentPayMutation();

  const form = useForm<SupplierPaymentPay>({
    resolver: zodResolver(supplierPaymentPaySchema),
    defaultValues: {
      supplierName: defaultValues?.supplierName ?? '',
      paymentDescription: defaultValues?.paymentDescription ?? '',
      amount: defaultValues?.amount ?? 0,
      currencyCode: defaultValues?.currencyCode ?? 'VES',
      paymentMethod: defaultValues?.paymentMethod ?? 'TRANSFER',
      bankReference: defaultValues?.bankReference ?? '',
      transactionDate: defaultValues?.transactionDate
        ? new Date(defaultValues.transactionDate)
        : new Date(),
      accountPayableReference: defaultValues?.accountPayableReference ?? '',
    },
  });

  const onSubmit = (data: SupplierPaymentPay) => {
    pay(data, {
      onSuccess: () => onSuccess?.(),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="supplierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del Proveedor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del proveedor"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
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
                    placeholder="Descripción"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    disabled={disabled}
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
                  disabled={disabled}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CURRENCY_CODE_LABELS).map(([key, label]) => (
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
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select
                  disabled={disabled}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
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
            name="bankReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia Bancaria</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Referencia (opcional)"
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
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
              <FormItem>
                <FormLabel>Fecha de Transacción</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={disabled}
                    value={
                      field.value
                        ? new Date(field.value).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : null,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountPayableReference"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Referencia Cuenta por Pagar</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Referencia de cuenta por pagar (opcional)"
                    {...field}
                    value={field.value ?? ''}
                    disabled={disabled}
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                disabled={isPaying}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPaying}>
                {isPaying ? 'Procesando...' : 'Registrar Pago'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
