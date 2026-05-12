import { useCategoriesByTypeQuery } from '@/features/core/categories/hooks/use-categories-queries';
import { CATEGORY_TYPES } from '@/features/core/categories/schemas/categories.schema';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Switch } from '@repo/shadcn/switch';
import { useForm } from 'react-hook-form';
import { useSaveWithdrawalTypeMutation } from '../hooks/use-withdrawal-types-query';
import {
  type WithdrawalTypeMutation,
  withdrawalTypeMutationSchema,
} from '../schemas/withdrawal-types.schema';

interface WithdrawalTypesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<WithdrawalTypeMutation>;
  disabled?: boolean;
}

export function WithdrawalTypesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: WithdrawalTypesFormProps) {
  const { mutate: saveWithdrawalType, isPending: isSaving } =
    useSaveWithdrawalTypeMutation();

  const { data: frequencyCategories } = useCategoriesByTypeQuery(
    CATEGORY_TYPES.DISCOUNT_FREQUENCY,
  );

  const form = useForm<WithdrawalTypeMutation>({
    resolver: zodResolver(withdrawalTypeMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      description: defaultValues?.description || '',
      withdrawalPercentage: defaultValues?.withdrawalPercentage ?? undefined,
      administrativeFeePercentage:
        defaultValues?.administrativeFeePercentage ?? undefined,
      withdrawalLimitQuantity:
        defaultValues?.withdrawalLimitQuantity ?? undefined,
      minimumAntiquityDays: defaultValues?.minimumAntiquityDays ?? undefined,
      withdrawalFrequencyRelation:
        defaultValues?.withdrawalFrequencyRelation ?? undefined,
      accountDebit: defaultValues?.accountDebit ?? undefined,
      expenseAccount: defaultValues?.expenseAccount ?? undefined,
      isHouseComercial: defaultValues?.isHouseComercial ?? false,
      isInternalInventory: defaultValues?.isInternalInventory ?? false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: WithdrawalTypeMutation) => {
    saveWithdrawalType(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  const frequencyOptions =
    frequencyCategories?.map((item) => ({
      value: item.id,
      label: item.name,
    })) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="withdrawalPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porcentaje Retiro Máximo (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
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
            name="administrativeFeePercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Porcentaje Gasto Administrativo (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* <FormField
            control={form.control}
            name="withdrawalLimitQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Límite de retiros</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          {/* <FormField
            control={form.control}
            name="minimumAntiquityDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antigüedad mínima (días)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="withdrawalFrequencyRelation"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Frecuencia Retiros</FormLabel>
                <SelectSearchable
                  options={frequencyOptions}
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : value)
                  }
                  placeholder="Selecciona una frecuencia"
                  defaultValue={field.value || 'null'}
                  disabled={disabled}
                  enableNoneOption
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isInternalInventory"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Utiliza Inventario</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isHouseComercial"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Utiliza Casa Comercial</FormLabel>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
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
          <div className="flex justify-end gap-4">
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
