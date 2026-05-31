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

const CURRENCY_OPTIONS = [
  { value: 'VES', label: 'Bolívar' },
  { value: 'USD', label: 'Dólar' },
  { value: 'EUR', label: 'Euro' },
];

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
      description: defaultValues?.description || '',
      value: defaultValues?.value || '',
      category: defaultValues?.category || 'general',
    },
  });

  const watchedKey = form.watch('key');

  const isBooleanKey = watchedKey === 'ACCOUNTING_AUTO_POSTING_MASTER';
  const isCurrencyKey = watchedKey === 'DEFAULT_CURRENCY';

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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input {...field} disabled={true} />
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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

          {/* <FormField
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
          /> */}
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