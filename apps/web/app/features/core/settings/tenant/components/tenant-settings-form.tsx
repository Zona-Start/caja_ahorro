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
import { useAuthStore } from '@/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { TENANTS_KEYS } from '../../../tenants/keys/tenants-keys';
import { tenantsService } from '../../../tenants/services/tenants-service';
import { useForm } from 'react-hook-form';
import {
  useCreateTenantSettingMutation,
  useUpdateTenantSettingMutation,
} from '../hooks/use-tenant-settings-mutations';
import {
  type TenantSettingMutation,
  tenantSettingMutationSchema,
} from '../schemas/tenant-settings.schema';

interface TenantSettingsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TenantSettingMutation>;
  disabled?: boolean;
  mode?: 'create' | 'edit';
}

const CURRENCY_OPTIONS = [
  { value: 'VES', label: 'Bolívar' },
  { value: 'USD', label: 'Dólar' },
  { value: 'EUR', label: 'Euro' },
];

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'security', label: 'Seguridad' },
  { value: 'notification', label: 'Notificaciones' },
];

export function TenantSettingsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
  mode = 'edit',
}: TenantSettingsFormProps) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { mutate: updateSetting, isPending: isUpdating } =
    useUpdateTenantSettingMutation();
  const { mutate: createSetting, isPending: isCreating } =
    useCreateTenantSettingMutation();

  const isCreateMode = mode === 'create';
  const isSaving = isUpdating || isCreating;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin && isCreateMode,
  });

  const tenantOptions =
    tenantsData?.data.map((t) => ({
      value: t.id,
      label: t.name,
    })) ?? [];

  const form = useForm<TenantSettingMutation>({
    resolver: zodResolver(tenantSettingMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId || undefined,
      key: defaultValues?.key || '',
      description: defaultValues?.description || '',
      value: defaultValues?.value || '',
      category: defaultValues?.category || 'general',
    },
  });

  const watchedKey = form.watch('key');
  const isBooleanKey = watchedKey === 'ACCOUNTING_AUTO_POSTING_MASTER';
  const isCurrencyKey = watchedKey === 'DEFAULT_CURRENCY';

  const onSubmit = (data: TenantSettingMutation) => {
    if (isCreateMode) {
      createSetting(data, {
        onSuccess: () => onSuccess?.(),
      });
    } else if (data.id) {
      updateSetting(
        { id: data.id, payload: { value: data.value } },
        { onSuccess: () => onSuccess?.() },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isCreateMode && (
            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clave</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: MAX_LOGIN_ATTEMPTS"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Descripción del parámetro"
                    {...field}
                    disabled={disabled || !isCreateMode}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isBooleanKey ? (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : isCurrencyKey ? (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={field.onChange}
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
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
          )}

          {isCreateMode && (
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || 'general'}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isSuperAdmin && (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={!isCreateMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tenant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
                {isSaving
                  ? 'Guardando...'
                  : isCreateMode
                    ? 'Crear'
                    : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
