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
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { useForm } from 'react-hook-form';
import { useAccountingAccountMutation } from '../hooks/use-accounting-accounts-mutation';
import { useAccountingAccounts } from '../hooks/use-accounting-accounts-query';
import {
  ACCOUNT_LEVELS,
  ACCOUNT_TYPES,
  NATURE_TYPE,
} from '../schemas/account-plan-options';
import { type AccountPlan, accountPlanSchema } from '../schemas/account-plan.schema';

interface AccountPlanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<AccountPlan>;
}

export function AccountPlanForm({
  onSuccess,
  onCancel,
  defaultValues,
}: AccountPlanFormProps) {
  const {
    mutate: saveAccountingAccounts,
    isPending: isSaving,
  } = useAccountingAccountMutation();

  const { data: AccoutingAccounts } = useAccountingAccounts();

  const form = useForm<AccountPlan>({
    resolver: zodResolver(accountPlanSchema),
    defaultValues: {
      code: defaultValues?.code || '',
      name: defaultValues?.name || '',
      accountType: defaultValues?.accountType || 'ASSET',
      level: defaultValues?.level || 1,
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId || '',
      parentAccountId:
        defaultValues?.parentAccountId && typeof defaultValues.parentAccountId === 'string'
          ? defaultValues.parentAccountId
          : null,
      allowsMovements: defaultValues?.allowsMovements || false,
      isActive: defaultValues?.isActive || true,
      nature: defaultValues?.nature || 'DEBIT',
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: AccountPlan) => {
    const formData = {
      ...data,
      parentAccountId:
        data.parentAccountId === null ? null : data.parentAccountId,
    };

    if (formData.parentAccountId) {
      const parentAccount = AccoutingAccounts?.find(
        (account) => account.id === formData.parentAccountId,
      );

      if (parentAccount && (parentAccount.level ?? 0) >= formData.level) {
        form.setError('parentAccountId', {
          type: 'manual',
          message: 'La cuenta padre debe ser de un nivel inferior',
        });
        return;
      }
    }

    saveAccountingAccounts(formData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la cuenta contable',
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
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="1.1.1" {...field} />
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Tipo de cuenta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                 
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px]">
                    {Object.entries(ACCOUNT_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
            name="level"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Nivel de Cuenta</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                 
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona nivel" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px]">
                    {Object.entries(ACCOUNT_LEVELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
            name="parentAccountId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Cuenta Padre</FormLabel>
                <SelectSearchable
                  options={
                    AccoutingAccounts?.map((account) => ({
                      value: account.id!.toString(),
                      label: `${account.code} - ${account.name}`,
                    })) || []
                  }
                  onValueChange={(value) =>
                    field.onChange(
                      value && value !== 'null' && value !== 'NaN'
                        ? value
                        : null,
                    )
                  }
                  placeholder="Selecciona una cuenta padre"
                  defaultValue={field.value?.toString() || 'null'}
                 
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nature"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Naturaleza</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                 
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px]">
                    {Object.entries(NATURE_TYPE).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
            name="allowsMovements"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Agrupadora</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value?.toString()}
                 
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px]">
                    <SelectItem value="true">Sí</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Estatus</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  defaultValue={field.value?.toString()}
                 
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px]">
                    <SelectItem value="true">Activa</SelectItem>
                    <SelectItem value="false">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
