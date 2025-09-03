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
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useAdvancePaymentMutation } from '../hooks/use-mutation-account-payable';
import { AdvancePayment, advancePaymentSchema } from '../schemas';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdvancePaymentForm({ onSuccess, onCancel }: FormProps) {
  const { mutate: createAdvance, isPending } = useAdvancePaymentMutation();
  const { data: bankAccounts, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSupplierAll();

  const form = useForm<AdvancePayment>({
    resolver: zodResolver(advancePaymentSchema),
    defaultValues: {
      supplierId: undefined,
      amount: 0,
      paymentMethod: PaymentMethodEnum.BANK_TRANSFER,
      transactionDate: new Date(),
      paymentDescription: '',
      bankAccountId: undefined,
      bankReference: undefined,
    },
  });

  const onSubmit = (data: AdvancePayment) => {
    createAdvance(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  if (isLoadingBankAccounts || isLoadingSuppliers) {
    return <p>Cargando información...</p>;
  }

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
                <SelectSearchable
                  options={
                    suppliers?.map((item) => ({
                      value: item.id!.toString(),
                      label: item.name,
                    })) || []
                  }
                  onValueChange={(value) => field.onChange(Number(value))}
                  placeholder="Selecciona un proveedor"
                  defaultValue={field.value?.toString()}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
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
                  defaultValue={field.value?.toString()}
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
                <FormLabel>Monto del Anticipo</FormLabel>
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
                <Select onValueChange={field.onChange} value={field.value}>
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
                <FormLabel>Fecha de Transacción</FormLabel>
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
                <FormLabel>Descripción del Anticipo</FormLabel>
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
            {isPending ? 'Procesando...' : 'Registrar Anticipo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
