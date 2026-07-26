import { zodResolver } from '@hookform/resolvers/zod';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Textarea } from '@repo/shadcn/textarea';
import { useForm } from 'react-hook-form';
import {
  useCreateBankReconciliationMutation,
} from '../hooks/use-bank-reconciliation-query';
import {
  bankReconciliationFormSchema,
  type BankReconciliationForm,
} from '../schemas/bank-reconciliation.schema';

interface BankReconciliationFormComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<BankReconciliationForm>;
  disabled?: boolean;
}

export function BankReconciliationForm({
  onSuccess,
  onCancel,
  disabled = false,
}: BankReconciliationFormComponentProps) {
  const createMutation = useCreateBankReconciliationMutation();
  const { data: accountsData } = useBankAccountAll();

  const form = useForm<BankReconciliationForm>({
    resolver: zodResolver(bankReconciliationFormSchema),
    defaultValues: {
      bankAccountId: '',
      statementDate: new Date(),
      statementEndingBalance: 0,
      notes: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = (formData: BankReconciliationForm) => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta Bancaria</FormLabel>
              <FormControl>
                <SelectSearchable
                  options={(accountsData?.data || []).map((account) => ({
                    value: account.id,
                    label: `${account.accountName || ''} - ${account.accountNumber}`,
                  }))}
                  onValueChange={field.onChange}
                  placeholder="Buscar cuenta bancaria..."
                  value={field.value || undefined}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="statementDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Corte del Extracto</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={
                      field.value instanceof Date
                        ? field.value.toISOString().split('T')[0]
                        : field.value || ''
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? new Date(e.target.value) : undefined,
                      )
                    }
                    disabled={disabled}
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
                <FormLabel>Saldo Final del Extracto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : 0,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notas adicionales..."
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

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending || disabled}>
            {createMutation.isPending ? 'Creando...' : 'Crear Conciliación'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
