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
import { Switch } from '@repo/shadcn/switch';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { bankDirectoryKeys } from '../keys/bank-directory-keys';
import type { Bank } from '../services/banks-service';
import { bankFormSchema, type BankForm } from '../schemas/banks.schema';

interface BanksFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Record<string, unknown>>;
  disabled?: boolean;
}

export function BanksForm({
  onSuccess,
  onCancel,
  defaultValues = {},
  disabled = false,
}: BanksFormProps) {
  const queryClient = useQueryClient();
  const { success: toastSuccess, error: toastError } = useToastSystem();

  const recordId = defaultValues.id as number | undefined;

  const saveMutation = useMutation({
    mutationFn: async (payload: BankForm) => {
      if (recordId) {
        const response = await apiClient.patch(
          `/banks-directory/${recordId}`,
          payload,
        );
        return response.data;
      }
      const response = await apiClient.post('/banks-directory', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankDirectoryKeys.all });
      toastSuccess(
        recordId
          ? 'Banco actualizado correctamente'
          : 'Banco creado correctamente',
      );
    },
    onError: (err) => {
      toastError(
        err instanceof Error ? err.message : 'Error al guardar el banco',
      );
    },
  });

  const form = useForm<BankForm>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      name: (defaultValues.name as string) || '',
      code: (defaultValues.code as string) || '',
      countryCode: (defaultValues.countryCode as string) || '',
      isActive: (defaultValues.isActive as boolean) ?? true,
    },
    mode: 'onChange',
  });

  const onSubmit = async (formData: BankForm) => {
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Banco</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Banco de Venezuela"
                  {...field}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: BDV"
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
            name="countryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código de País</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: VE"
                    {...field}
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
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Banco Activo</FormLabel>
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
