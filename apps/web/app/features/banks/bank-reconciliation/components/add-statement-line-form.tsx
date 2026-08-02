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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAddStatementLineMutation } from '../hooks/use-bank-reconciliation-query';

const addStatementLineFormSchema = z.object({
  transactionDate: z.coerce.date({
    errorMap: () => ({ message: 'La fecha es requerida' }),
  }),
  isCredit: z.boolean().default(false),
  amount: z.coerce.number().min(0.01, 'El monto debe ser mayor a 0'),
  bankReference: z.string().max(100).optional().nullable(),
  description: z.string().min(1, 'La descripción es requerida'),
});

type FormFields = z.infer<typeof addStatementLineFormSchema>;

interface AddStatementLineFormProps {
  reconciliationId: string;
  statementDate: Date;
  startDate?: Date | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddStatementLineForm({
  reconciliationId,
  statementDate,
  startDate,
  onSuccess,
  onCancel,
}: AddStatementLineFormProps) {
  const mutation = useAddStatementLineMutation();

  const form = useForm<FormFields>({
    resolver: zodResolver(addStatementLineFormSchema),
    defaultValues: {
      transactionDate: new Date(),
      isCredit: false,
      amount: 0,
      description: '',
      bankReference: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = (data: FormFields) => {
    if (data.transactionDate > statementDate) {
      form.setError('transactionDate', {
        message:
          'La fecha no puede ser posterior a la fecha de corte de la conciliación',
      });
      return;
    }
    if (startDate && data.transactionDate < startDate) {
      form.setError('transactionDate', {
        message:
          'La fecha no puede ser anterior a la fecha de inicio de la conciliación',
      });
      return;
    }

    mutation.mutate(
      {
        reconciliationId,
        payload: {
          transactionDate: data.transactionDate,
          description: data.description,
          bankReference: data.bankReference || null,
          isCredit: data.isCredit,
          amount: data.amount,
        },
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      },
    );
  };

  const watchType = form.watch('isCredit');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <h4 className="text-sm font-medium">Nueva Línea de Extracto</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="transactionDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    max={statementDate.toISOString().split('T')[0]}
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isCredit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === 'true')}
                  value={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Crédito (Entrada)</SelectItem>
                    <SelectItem value="false">Débito (Salida)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    min="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : 0,
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
            name="bankReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: REF-001"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Comisión bancaria, Transferencia recibida..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Agregando...'
              : `Agregar ${watchType ? 'Crédito' : 'Débito'}`}
          </Button>
        </div>
      </form>
    </Form>
  );
}
