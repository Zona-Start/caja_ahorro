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
import { useForm } from 'react-hook-form';
import { useOpenSessionMutation } from '../hooks/use-cash-register-queries';
import {
  openSessionSchema,
  type OpenSessionForm,
} from '../schemas/cash-registers.schema';

interface OpenSessionFormProps {
  cashRegisterId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function OpenSessionForm({
  cashRegisterId,
  onSuccess,
  onCancel,
}: OpenSessionFormProps) {
  const openSessionMutation = useOpenSessionMutation();

  const form = useForm<OpenSessionForm>({
    resolver: zodResolver(openSessionSchema),
    defaultValues: { cashRegisterId, initialBalance: 0 },
  });

  const onSubmit = (data: OpenSessionForm) => {
    openSessionMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="initialBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Saldo Inicial (Fondo de caja)</FormLabel>
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
                      e.target.value ? parseFloat(e.target.value) : undefined,
                    )
                  }
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
          <Button type="submit" disabled={openSessionMutation.isPending}>
            {openSessionMutation.isPending ? 'Abriendo...' : 'Abrir Sesión'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
