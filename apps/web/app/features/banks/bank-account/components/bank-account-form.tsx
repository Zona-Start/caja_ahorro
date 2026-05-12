import { zodResolver } from '@hookform/resolvers/zod';
import { apiClient } from '@/lib/api-client';
import { useToastSystem } from '@/hooks/use-toast-system';
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
import { Switch } from '@repo/shadcn/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useBanksQuery } from '../../bank-directory/hooks/use-banks-querys';
import { bankAccountKeys } from '../keys/bank-account-keys';
import {
  ACCOUNT_TYPE_OPTIONS,
  CURRENCY_CODE_OPTIONS,
  ACCOUNT_TYPE,
  CURRENCY_CODE,
} from '../schemas/bank-account-options';
import {
  bankAccountFormSchema,
  type BankAccountForm,
} from '../schemas/bank-account.schema';

interface BankAccountFormComponentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Record<string, unknown>>;
  disabled?: boolean;
}

export function BankAccountForm({
  onSuccess,
  onCancel,
  defaultValues = {},
  disabled = false,
}: BankAccountFormComponentProps) {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();
  const { data: banksData } = useBanksQuery();

  const recordId = defaultValues.id as number | undefined;

  const saveMutation = useMutation({
    mutationFn: async (payload: BankAccountForm) => {
      if (recordId) {
        const response = await apiClient.patch(
          `/savings-banks/bank-accounts/${recordId}`,
          payload,
        );
        return response.data;
      }
      const response = await apiClient.post(
        '/savings-banks/bank-accounts',
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.all });
      toastSuccess(
        recordId
          ? 'Cuenta bancaria actualizada correctamente'
          : 'Cuenta bancaria creada correctamente',
      );
    },
    onError: (err) => {
      toastError(
        err instanceof Error
          ? err.message
          : 'Error al guardar la cuenta bancaria',
      );
    },
  });

  const form = useForm<BankAccountForm>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bankDirectoryId: (defaultValues.bankDirectoryId as number) ?? undefined,
      accountName: (defaultValues.accountName as string) || '',
      accountNumber: (defaultValues.accountNumber as string) || '',
      accountType: (defaultValues.accountType as ACCOUNT_TYPE) ?? undefined,
      currencyCode: (defaultValues.currencyCode as CURRENCY_CODE) ?? undefined,
      openingDate: defaultValues.openingDate
        ? new Date(defaultValues.openingDate as string)
        : new Date(),
      currentBalance: (defaultValues.currentBalance as number) ?? 0,
      linkedChartAccountId:
        (defaultValues.linkedChartAccountId as number | null) ?? undefined,
      isActive: (defaultValues.isActive as boolean) ?? true,
    } as BankAccountForm,
    mode: 'onChange',
  });

  const onSubmit = (formData: BankAccountForm) => {
    saveMutation.mutate(formData, {
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
          name="bankDirectoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Banco</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(Number(v))}
                value={field.value?.toString() || ''}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un banco" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(banksData?.data || [])
                    .filter((b) => b.id != null)
                    .map((bank) => (
                      <SelectItem key={bank.id} value={bank.id!.toString()}>
                        {bank.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Cuenta Principal BOD"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: 0116-0001-00-0000000001"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cuenta</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ACCOUNT_TYPE_OPTIONS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(CURRENCY_CODE_OPTIONS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ),
                    )}
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
            name="openingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Apertura</FormLabel>
                <FormControl>
                  <Input
                    type="date"
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
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currentBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Balance Actual</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : 0,
                      )
                    }
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="linkedChartAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta Contable Vinculada</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="ID de cuenta contable"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? Number(e.target.value) : undefined,
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Cuenta Activa</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />

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
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
