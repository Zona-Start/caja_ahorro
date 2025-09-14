'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useCategoriesTypesGroup } from '@/feactures/common/category-types/hooks/use-querys-category-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Switch } from '@repo/shadcn/components/ui/switch';
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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm } from 'react-hook-form';
import { useWithdrawalTypesMutation } from '../hooks/use-mutation-withdrawal-types';
import {
  WithdrawalTypes,
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
    useWithdrawalTypesMutation();
  const { data: AccoutingAccountsPlans } = useAccountingAccounts();
  const { data: CategoryFrecuentia } = useCategoriesTypesGroup('DISCOUNT_FREQ');

  const form = useForm<WithdrawalTypes>({
    resolver: zodResolver(withdrawalTypesSchema),
    defaultValues: {
      id: defaultValues?.id,
      description: defaultValues?.description || '',
      withdrawalPercentage: defaultValues?.withdrawalPercentage || '',
      accountDebit: defaultValues?.accountDebit || undefined,
      expenseAccount: defaultValues?.expenseAccount || undefined,
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
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el tipo de rétiro',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
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
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
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
                    className={readOnly ? 'bg-muted' : ''}
                    required
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountDebit"
            render={({ field }) => (
              <FormItem className="col-span-2 w-full">
                <FormLabel>Cuenta Contable</FormLabel>
                <SelectSearchable
                  options={
                    AccoutingAccountsPlans?.data?.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    })) || []
                  }
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  placeholder="Selecciona cuenta contable"
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expenseAccount"
            render={({ field }) => (
              <FormItem className="col-span-2 w-full">
                <FormLabel>Cuenta Gasto</FormLabel>
                <SelectSearchable
                  options={
                    AccoutingAccountsPlans?.data?.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    })) || []
                  }
                  onValueChange={(value) =>
                    field.onChange(value === 'null' ? null : Number(value))
                  }
                  placeholder="Selecciona cuenta contable"
                  defaultValue={field.value?.toString() || 'null'}
                  disabled={readOnly}
                />
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
                    className={readOnly ? 'bg-muted' : ''}
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
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    {CategoryFrecuentia?.data?.map((item: any) => (
                      <SelectItem
                        key={item.id}
                        value={item.id!.toString()}
                        className={readOnly ? 'bg-muted' : ''}
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
        <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
