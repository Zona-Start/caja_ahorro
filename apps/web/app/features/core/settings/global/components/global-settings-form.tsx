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
import { useSaveGlobalSettingMutation } from '../hooks/use-global-settings-mutations';
import {
  type GlobalSettingMutation,
  globalSettingMutationSchema,
} from '../schemas/global-settings.schema';

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'notification', label: 'Notificaciones' },
  { value: 'security', label: 'Seguridad' },
  { value: 'system', label: 'Sistema' },
] as const;

interface GlobalSettingsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<GlobalSettingMutation>;
  disabled?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export function GlobalSettingsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
  mode = 'create',
}: GlobalSettingsFormProps) {
  const { mutate: saveSetting, isPending: isSaving } = useSaveGlobalSettingMutation();

  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';

  const form = useForm<GlobalSettingMutation>({
    resolver: zodResolver(globalSettingMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      key: defaultValues?.key || '',
      value: defaultValues?.value || '',
      description: defaultValues?.description || '',
      category: defaultValues?.category || 'general',
    },
  });

  const onSubmit = (data: GlobalSettingMutation) => {
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
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clave</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: max_login_attempts"
                    {...field}
                    disabled={disabled || isEditMode}
                  />
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || 'general'}
                  disabled={isViewMode}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
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
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          {isViewMode ? (
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
