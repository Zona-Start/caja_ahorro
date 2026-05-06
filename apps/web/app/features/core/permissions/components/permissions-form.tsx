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
import { useSavePermissionMutation } from '../hooks/use-permissions-mutations';
import {
  type PermissionMutation,
  permissionMutationSchema,
} from '../schemas/permissions.schema';
import { ACTION_OPTIONS, RESOURCE_OPTIONS, SCOPE_OPTIONS } from '../schemas/permission.option';

interface PermissionsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<PermissionMutation>;
  disabled?: boolean;
}

export function PermissionsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: PermissionsFormProps) {
  const { mutate: savePermission, isPending: isSaving } =
    useSavePermissionMutation();

  const form = useForm<PermissionMutation>({
    resolver: zodResolver(permissionMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      resource: defaultValues?.resource || '',
      action: defaultValues?.action || '',
      scope: defaultValues?.scope || 'own',
      description: defaultValues?.description || '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const onSubmit = (data: PermissionMutation) => {
    savePermission(data, {
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del permiso"
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
            name="resource"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurso</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar recurso" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RESOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acción</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar acción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACTION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alcance</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar alcance" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
              <FormItem className="md:col-span-2">
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Descripción del permiso"
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
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Activo</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    disabled={disabled}
                  />
                </FormControl>
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
