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
import { useUpdateTenantSettingMutation } from '../hooks/use-tenant-settings-mutations';
import {
  type TenantSettingMutation,
  tenantSettingMutationSchema,
} from '../schemas/tenant-settings.schema';

interface TenantSettingsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TenantSettingMutation>;
  disabled?: boolean;
}

export function TenantSettingsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: TenantSettingsFormProps) {
  const { mutate: updateSetting, isPending: isSaving } = useUpdateTenantSettingMutation();

  const form = useForm<TenantSettingMutation>({
    resolver: zodResolver(tenantSettingMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      key: defaultValues?.key || '',
      value: defaultValues?.value || '',
      category: defaultValues?.category || 'general',
    },
  });

  const onSubmit = (data: TenantSettingMutation) => {
    if (!data.id) return;
    updateSetting(
      { id: data.id, payload: { value: data.value } },
      { onSuccess: () => onSuccess?.() },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clave</FormLabel>
                <FormControl>
                  <Input {...field} disabled={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Valor del parámetro"
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
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                  <Input {...field} disabled={true} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          {disabled ? (
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}