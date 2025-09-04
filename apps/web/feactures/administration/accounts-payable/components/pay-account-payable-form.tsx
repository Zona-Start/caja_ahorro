'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/components/ui/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/components/ui/form';
import { Input } from '@repo/shadcn/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/components/ui/select';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { useForm } from 'react-hook-form';
import { useBankAccountAll } from '../../../banks/bank-account/hooks/use-query-bank-account';
import {
  PAYMENT_METHOD_TYPES,
  PaymentMethodEnum,
} from '../../supplier-payments/schemas';
import { usePayAccountPayableMutation } from '../hooks';
import {
  AccountPayable,
  PayAccountPayable,
  payAccountPayableSchema,
} from '../schemas';

import { useEffect } from 'react';
import { useGetPreloadedPayment } from '../hooks';

interface FormProps {
  accountPayable: AccountPayable;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PayAccountPayableForm({
  accountPayable,
  onSuccess,
  onCancel,
}: FormProps) {
  const { mutate: pay, isPending } = usePayAccountPayableMutation();
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();
  const { data: preloadedData, isLoading: isLoadingPreload } =
    useGetPreloadedPayment(accountPayable.id!, { enabled: true });

  const form = useForm<PayAccountPayable>({
    resolver: zodResolver(payAccountPayableSchema),
    // Iniciar el formulario con valores base para evitar error de componente no controlado a controlado
    defaultValues: {
      supplierId: accountPayable?.supplierId,
      accountsPayableId: accountPayable.id,
      amount: 0,
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
      paymentDescription: '',
      bankAccountId: preloadedData?.bankAccountId ?? undefined,
      bankReference: undefined,
    },
  });

  useEffect(() => {
    // No hacer nada hasta que ambas consultas terminen
    if (isLoadingPreload || isLoadingBankAccounts) return;

    let initialValues;
    if (preloadedData) {
      // Prioridad 1: Usar datos precargados si existen
      initialValues = {
        supplierId: preloadedData.supplierId,
        accountsPayableId: accountPayable.id,
        amount: Number(preloadedData.amount),
        bankAccountId: preloadedData.bankAccountId,
        paymentMethod:
          preloadedData.paymentMethod || PaymentMethodEnum.BANK_TRANSFER,
        transactionDate: preloadedData.transactionDate
          ? new Date(preloadedData.transactionDate)
          : new Date(),
        bankReference: preloadedData.bankReference,
        paymentDescription: preloadedData.paymentDescription || undefined,
      };
    } else {
      // Prioridad 2: Usar los datos de la cuenta por pagar si no hay datos precargados
      initialValues = {
        supplierId: accountPayable.supplierId,
        accountsPayableId: accountPayable.id,
        amount: Number(accountPayable.remainingAmount),
        paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
        transactionDate: new Date(),
        paymentDescription: undefined,
        bankAccountId: undefined,
        bankReference: undefined,
      };
    }
    form.reset({
      ...initialValues,
      bankAccountId: initialValues.bankAccountId || undefined,
      bankReference: initialValues.bankReference || undefined,
    });
  }, [
    preloadedData,
    isLoadingPreload,
    bankAccounts,
    isLoadingBankAccounts,
    accountPayable,
    form.reset,
  ]);

  const onSubmit = (data: PayAccountPayable) => {
    pay(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  if (isLoadingPreload || isLoadingBankAccounts) {
    return <p>Cargando información de pago...</p>;
  }

  return (
    <Form {...form}>
      <div className="space-y-2 text-sm mb-4 p-2 bg-muted rounded-md">
        <div className="flex justify-between">
          <strong>Proveedor:</strong>
          <span>{accountPayable?.supplierName}</span>
        </div>
        <div className="flex justify-between">
          <strong>Factura:</strong>
          <span>{accountPayable.supplierInvoice?.invoiceNumber}</span>
        </div>
        <div className="flex justify-between">
          <strong>Saldo Pendiente:</strong>
          <span className="font-bold">
            {Number(accountPayable.remainingAmount).toFixed(2)}
          </span>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem key={field.value}>
                <FormLabel>Pagar desde la cuenta</FormLabel>
                <SelectSearchable
                  options={
                    bankAccounts?.data.map((item: any) => ({
                      value: item.id!.toString(),
                      label: `${item.accountName} - ${item.accountNumber}`,
                    })) || []
                  }
                  onValueChange={(value) => field.onChange(Number(value))}
                  placeholder="Selecciona una cuenta bancaria"
                  defaultValue={field.value?.toString()} // Usar defaultValue, controlado por el `key` del parent
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto a Pagar</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
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
                  onValueChange={field.onChange}
                  value={field.value} // Usar value para componente controlado
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione un método" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_TYPES).map(
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
              <FormItem>
                <FormLabel>Fecha de Pago</FormLabel>
                <FormControl>
                  <CustomCalendar
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
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
                  <Input {...field} value={field.value ?? ''} />
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
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Procesando...' : 'Confirmar Pago'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
