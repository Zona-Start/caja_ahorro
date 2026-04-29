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
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { Textarea } from '@repo/shadcn/textarea';
import { useForm } from 'react-hook-form';
import { useSupplierAll } from '../../suppliers/hooks/use-query-suppliers';
import { useAdvancePaymentMutation } from '../hooks/use-mutation-account-payable';
import { AdvancePayment, advancePaymentSchema } from '../schemas';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdvancePaymentForm({ onSuccess, onCancel }: FormProps) {
  const { mutate: createAdvance, isPending } = useAdvancePaymentMutation();
  const { data: suppliers } = useSupplierAll();

  const form = useForm<AdvancePayment>({
    resolver: zodResolver(advancePaymentSchema),
    defaultValues: {
      supplierId: undefined,
      amount: 0,

      observations: '',
    },
  });

  const onSubmit = (data: AdvancePayment) => {
    createAdvance(data, {
      onSuccess: () => {
        onSuccess?.();
      },
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
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detalles del Anticipo</FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} />
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
