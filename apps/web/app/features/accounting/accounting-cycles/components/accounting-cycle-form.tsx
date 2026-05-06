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
import { useAccountingCycleMutation } from '../hooks/use-accounting-cycles-mutation';
import {
  type AccountingCycle,
  accountingCycleSchema,
} from '../schemas/accounting-cycle.schema';
import { CycleStatusEnum } from '../schemas/accounting-cycle-options';

interface AccountingCycleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountingCycle>;
  disabled?: boolean;
}

export function AccountingCycleForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: AccountingCycleFormProps) {
  const { mutate: saveCycle, isPending: isSaving } = useAccountingCycleMutation();

  const form = useForm<AccountingCycle>({
    resolver: zodResolver(accountingCycleSchema),
    defaultValues: {
      id: defaultValues?.id,
      description: defaultValues?.description || '',
      startDate: defaultValues?.startDate ? new Date(defaultValues.startDate) : new Date(),
      endDate: defaultValues?.endDate ? new Date(defaultValues.endDate) : new Date(),
      status: defaultValues?.status || CycleStatusEnum.PENDING,
    },
  });

  const onSubmit = async (data: AccountingCycle) => {
    saveCycle(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Ejercicio 2024" {...field} disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Inicio</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Fin</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4 pt-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
