import { zodResolver } from '@hookform/resolvers/zod';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { Button } from '@repo/shadcn/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Textarea } from '@repo/shadcn/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useCreateBankReconciliationMutation } from '../hooks/use-bank-reconciliation-query';

const formSchema = z.object({
  bankAccountId: z.string().uuid('Cuenta requerida'),
  startDate: z.coerce.date({ errorMap: () => ({ message: 'Fecha inicio requerida' }) }),
  statementDate: z.coerce.date({ errorMap: () => ({ message: 'Fecha fin requerida' }) }),
  statementEndingBalance: z.coerce.number().min(0, 'Saldo no puede ser negativo'),
  notes: z.string().max(500).optional().nullable(),
});

type FormFields = z.infer<typeof formSchema>;

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BankReconciliationForm({ onSuccess, onCancel }: Props) {
  const createMutation = useCreateBankReconciliationMutation();
  const { data: accountsData } = useBankAccountAll();

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bankAccountId: '',
      startDate: new Date(),
      statementDate: new Date(),
      statementEndingBalance: 0,
      notes: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = (data: FormFields) => {
    if (data.startDate > data.statementDate) {
      form.setError('statementDate', {
        message: 'La fecha fin debe ser mayor o igual a la fecha inicio',
      });
      return;
    }
    createMutation.mutate(data, { onSuccess: () => { form.reset(); onSuccess?.(); } });
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
                  options={(accountsData?.data || []).map((a: any) => ({
                    value: a.id,
                    label: `${a.accountName || ''} - ${a.accountNumber}`,
                  }))}
                  onValueChange={field.onChange}
                  placeholder="Buscar cuenta..."
                  value={field.value || undefined}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Inicio (Desde)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="statementDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha Fin / Corte (Hasta)</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="statementEndingBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Final del Extracto</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} />
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
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea placeholder="Notas adicionales..." {...field} value={field.value ?? ''} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creando...' : 'Crear Conciliación'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
