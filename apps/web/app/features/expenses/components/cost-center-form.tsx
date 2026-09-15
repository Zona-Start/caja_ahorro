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
import { useCreateCostCenterMutation } from '../hooks/use-cost-center-queries';
import {
  costCenterFormSchema,
  type CostCenterForm,
} from '../schemas/cost-centers.schema';

interface CostCenterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CostCenterForm({ onSuccess, onCancel }: CostCenterFormProps) {
  const createMutation = useCreateCostCenterMutation();

  const form = useForm<CostCenterForm>({
    resolver: zodResolver(costCenterFormSchema),
    defaultValues: { isActive: true, code: '', name: '' },
  });

  const onSubmit = (data: CostCenterForm) => {
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código</FormLabel>
              <FormControl>
                <Input placeholder="Ej: ADM-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Administración" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="monthlyBudget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Presupuesto Mensual (opcional)</FormLabel>
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

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Centro de Costo Activo</FormLabel>
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
            {createMutation.isPending
              ? 'Guardando...'
              : 'Crear Centro de Costo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
