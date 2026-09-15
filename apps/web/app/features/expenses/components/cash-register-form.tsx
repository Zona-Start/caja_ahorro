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
import { Switch } from '@repo/shadcn/switch';
import { useForm } from 'react-hook-form';
import { useCreateCashRegisterMutation } from '../hooks/use-cash-register-queries';
import {
  cashRegisterFormSchema,
  type CashRegisterForm,
} from '../schemas/cash-registers.schema';

interface CashRegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CashRegisterForm({
  onSuccess,
  onCancel,
}: CashRegisterFormProps) {
  const createMutation = useCreateCashRegisterMutation();

  const form = useForm<CashRegisterForm>({
    resolver: zodResolver(cashRegisterFormSchema),
    defaultValues: { isActive: true, name: '' },
  });

  const onSubmit = (data: CashRegisterForm) => {
    createMutation.mutate(data, {
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Caja Principal POS 1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Caja Activa</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Guardando...' : 'Crear Caja'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
