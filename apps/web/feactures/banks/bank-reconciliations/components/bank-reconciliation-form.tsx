'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BankReconciliation,
  bankReconciliationSchema,
} from '../schemas/bank-reconciliation.schema';
import { useMutationCreateReconciliation } from '../hooks/use-mutation-bank-reconciliations';
import { Button } from '@repo/shadcn/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/components/ui/form';
import { Input } from '@repo/shadcn/input';
import { Textarea } from '@repo/shadcn/components/ui/textarea';

interface BankReconciliationFormProps {
  onSuccess?: () => void;
  bankAccountId?: number;
}

export const BankReconciliationForm = ({
  onSuccess,
  bankAccountId,
}: BankReconciliationFormProps) => {
  const mutation = useMutationCreateReconciliation();

  const form = useForm<BankReconciliation>({
    resolver: zodResolver(bankReconciliationSchema),
    defaultValues: {
      bankAccountId: bankAccountId || 0,
      statementDate: new Date(),
      statementEndingBalance: 0,
      notes: '',
    },
  });

  const onSubmit = (data: BankReconciliation) => {
    mutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Usualmente bankAccountId viene de select o props, lo mostramos condicional */}
        {!bankAccountId && (
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Bancaria (ID)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="statementDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del Extracto</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  value={
                    field.value
                      ? new Date(field.value).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => field.onChange(new Date(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="statementEndingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Final Según Banco</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? 'Iniciando...' : 'Iniciar Conciliación'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
