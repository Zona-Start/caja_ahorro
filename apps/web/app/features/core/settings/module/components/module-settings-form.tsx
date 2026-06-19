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
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/auth.store';
import { TENANTS_KEYS } from '../../../tenants/keys/tenants-keys';
import { tenantsService } from '../../../tenants/services/tenants-service';
import { useSaveModuleSettingMutation } from '../hooks/use-module-settings-mutations';
import {
  type ModuleSettingMutation,
  moduleSettingMutationSchema,
} from '../schemas/module-settings.schema';

interface ModuleSettingsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<ModuleSettingMutation>;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

const MODULE_OPTIONS = [
  { value: 'savings', label: 'Caja de Ahorro' },
  { value: 'portfolio', label: 'Cartera' },
  { value: 'accounting', label: 'Contabilidad' },
  { value: 'banking', label: 'Banca' },
  { value: 'inventory', label: 'Inventario' },
  { value: 'purchasing', label: 'Compras' },
];

const FREQUENCY_OPTIONS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export function ModuleSettingsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
  mode = 'create',
}: ModuleSettingsFormProps) {
  const { mutate: saveSetting, isPending: isSaving } = useSaveModuleSettingMutation();
  const user = useAuthStore((s) => s.user);
  const isSystemAdmin = user?.isSystemAdmin ?? false;

  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';
  const showAllFields = isCreateMode || isSystemAdmin;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSystemAdmin || isCreateMode,
  });

  const tenantOptions =
    tenantsData?.data.map((t) => ({
      value: t.id,
      label: t.name,
    })) ?? [];

  const form = useForm<ModuleSettingMutation>({
    resolver: zodResolver(moduleSettingMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId || '',
      module: defaultValues?.module || '',
      submodule: defaultValues?.submodule || '',
      key: defaultValues?.key || '',
      value: defaultValues?.value || '',
      description: defaultValues?.description || '',
    },
  });

  const watchedModule = form.watch('module');
  const watchedSubmodule = form.watch('submodule');
  const watchedKey = form.watch('key');
  const watchedValue = form.watch('value');

  const isFrequencyKey =
    watchedModule === 'savings' &&
    watchedSubmodule === 'contributions' &&
    watchedKey === 'DEFAULT_DISCOUNT_FREQUENCY';

  const isBooleanValue = watchedValue === 'true' || watchedValue === 'false';

  const onSubmit = (data: ModuleSettingMutation) => {
    saveSetting(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showAllFields && (
            <>
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={disabled || !isCreateMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
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

              <FormField
                control={form.control}
                name="module"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Módulo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: savings, accounting"
                        {...field}
                        disabled={disabled}
                        list="module-options"
                      />
                    </FormControl>
                    <datalist id="module-options">
                      {MODULE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="submodule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submódulo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Submódulo (opcional)"
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
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clave</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: max_withdrawal_amount"
                        {...field}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {isViewMode && !showAllFields && (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Input {...field} disabled value={field.value} />
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
                    disabled={disabled || !showAllFields}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isFrequencyKey ? (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder="Selecciona una frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((opt) => (
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
          ) : isBooleanValue ? (
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <Select
                    disabled={disabled}
                    onValueChange={field.onChange}
                    value={field.value}
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