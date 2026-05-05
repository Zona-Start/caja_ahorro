import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Switch } from '@repo/shadcn/switch';
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
import { useCategoriesTypesGroupQuery } from '@/features/common/category-types/hooks/use-querys-category-types';
import { useSaveWithdrawalTypeMutation } from '../hooks/use-withdrawal-types-query';
import {
  type WithdrawalTypes,
  withdrawalTypesSchema,
} from '../schemas/withdrawal-types.schema';

interface WithdrawalTypesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<WithdrawalTypes>;
  readOnly?: boolean;
}

export function WithdrawalTypesForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: WithdrawalTypesFormProps) {
  const { mutate: saveWithdrawalType, isPending: isSaving } =
    useSaveWithdrawalTypeMutation();
  
  const { data: categoryFrequency } = useCategoriesTypesGroupQuery('DISCOUNT_FREQ');

  const form = useForm<WithdrawalTypes>({
    resolver: zodResolver(withdrawalTypesSchema),
    defaultValues: {
      id: defaultValues?.id,
      description: defaultValues?.description || '',
      withdrawalPercentage: defaultValues?.withdrawalPercentage || '',
      administrativeFeePercentage:
        defaultValues?.administrativeFeePercentage || '',
      withdrawalFrequencyRelation: defaultValues?.withdrawalFrequencyRelation,
      isHouseComercial: defaultValues?.isHouseComercial || false,
      isInternalInventory: defaultValues?.isInternalInventory || false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: WithdrawalTypes) => {
    saveWithdrawalType(data, {
      onSuccess: () => {
        form.reset();
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={readOnly}
                  />
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
                <FormLabel>Porcentaje retiro</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={readOnly}
                    required
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
                <FormLabel>Porcentaje Gasto Administrativo</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={readOnly}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="withdrawalFrequencyRelation"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Frecuencia Retiros</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un frecuencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryFrequency?.data?.map((item: any) => (
                      <SelectItem
                        key={item.id}
                        value={item.id!.toString()}
                      >
                        {item.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving || readOnly}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
