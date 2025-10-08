'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
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
import { useForm } from 'react-hook-form';
import { useAccountPayableBySupplier } from '../../accounts-payable/hooks/use-query-account-payable';
import { useSupplierTransactionMutation } from '../hooks/use-mutation-supplier-transaction';
import {
  PAYMENT_METHODS,
  PaymentMethodEnum,
  SUPPLIER_TRANSACTION_STATUS_TYPES,
  SUPPLIER_TRANSACTION_TYPES,
  SupplierTransactionStatusEnum,
  SupplierTransactionTypeEnum,
} from '../schemas/supplier-transaction-options';
import {
  SupplierTransaction,
  supplierTransactionSchema,
} from '../schemas/supplier-transaction.schema';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierTransaction>;
  readOnly?: boolean;
}

export function SupplierTransactionForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: FormProps) {
  const { mutate: saveSupplierTransaction, isPending: isSaving } =
    useSupplierTransactionMutation();

  const form = useForm<SupplierTransaction>({
    resolver: zodResolver(supplierTransactionSchema),
    defaultValues: {
      id: defaultValues?.id,
      accountsPayableId: defaultValues?.accountsPayableId,
      transactionType:
        defaultValues?.transactionType || SupplierTransactionTypeEnum.PAYMENT,
      transactionDate: defaultValues?.transactionDate
        ? new Date(defaultValues.transactionDate)
        : new Date(),
      amount: defaultValues?.amount || 0,
      currencyCode: defaultValues?.currencyCode || 'USD',
      paymentMethod:
        defaultValues?.paymentMethod || PaymentMethodEnum.BANK_TRANSFER,
      reference: defaultValues?.reference || '',
      status: defaultValues?.status || SupplierTransactionStatusEnum.ACTIVE,
    },
    mode: 'onChange',
  });

  const accountsPayableId = form.watch('accountsPayableId');

  const { data: accountsPayable } = useAccountPayableBySupplier(
    accountsPayableId,
    {
      enabled: accountsPayableId !== undefined,
    },
  );

  const onSubmit = async (data: SupplierTransaction) => {
    saveSupplierTransaction(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        form.setError('root', {
          type: 'manual',
          message:
            error.message || 'Error al guardar la transacción de proveedor',
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
              name="accountsPayableId"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Cuenta por Pagar</FormLabel>
                  <SelectSearchable
                    options={
                      accountsPayable?.data.map((item) => ({
                        value: item.id!.toString(),
                        label: `${item.supplierInvoice?.invoiceNumber} - ${item.supplierInvoice?.supplierName}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona una cuenta por pagar"
                    defaultValue={field.value?.toString()}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Tipo de Transacción</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un tipo de transacción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {Object.entries(SUPPLIER_TRANSACTION_TYPES).map(
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
                      disabled={readOnly}
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
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                      {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
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
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={readOnly} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        <SelectValue placeholder="Seleccione un estatus" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {Object.entries(SUPPLIER_TRANSACTION_STATUS_TYPES).map(
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
