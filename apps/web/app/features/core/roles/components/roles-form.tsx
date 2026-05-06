import { useAuthStore } from '@/stores/auth.store';
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
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useSaveRoleMutation } from '../hooks/use-roles-mutations';
import { usePermissionsQuery } from '../hooks/use-roles-queries';
import { type RoleMutation, roleMutationSchema } from '../schemas/roles.schema';

interface RolesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<RoleMutation>;
  disabled?: boolean;
}

export function RolesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: RolesFormProps) {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;
  const activeTenantId = user?.activeTenantId ?? null;
  const hasActiveTenant = !!activeTenantId;

  const { data: tenantsData } = useTenantsQuery(
    {
      page: 1,
      limit: 100,
      isActive: 'true',
    },
    isSystemAdmin,
  );

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    usePermissionsQuery();

  const { mutate: saveRole, isPending: isSaving } = useSaveRoleMutation();

  const isEditing = !!defaultValues?.id;
  const originalTenantId = defaultValues?.tenantId || '';

  const form = useForm<RoleMutation>({
    resolver: zodResolver(roleMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: isSystemAdmin
        ? isEditing
          ? originalTenantId
          : (activeTenantId ?? '')
        : (activeTenantId ?? ''),
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      isDefault: defaultValues?.isDefault || false,
      permissionIds: defaultValues?.permissionIds || [],
    },
  });

  const onSubmit = (data: RoleMutation) => {
    let finalTenantId: string;

    if (isSystemAdmin) {
      finalTenantId = data.tenantId || originalTenantId;
    } else {
      finalTenantId = activeTenantId ?? '';
    }

    if (!finalTenantId) {
      form.setError('tenantId', {
        message:
          'No tienes un tenant activoassigned. Contacta al administrador.',
      });
      return;
    }

    const submitData = {
      ...data,
      tenantId: finalTenantId,
    };

    saveRole(submitData, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isSystemAdmin && (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tenant">
                          {field.value
                            ? tenantsData?.data?.find(
                                (t) => t.id === field.value,
                              )?.name
                            : 'Seleccionar tenant'}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantsData?.data?.map((tenant) => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del rol"
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Descripción del rol"
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
            name="isDefault"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Rol por Defecto</FormLabel>
                  <FormMessage />
                </div>
                <FormControl>
                  <Input
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

        <FormField
          control={form.control}
          name="permissionIds"
          render={() => (
            <FormItem>
              <FormLabel>Permisos</FormLabel>
              {isLoadingPermissions ? (
                <div className="text-sm text-muted-foreground">
                  Cargando permisos...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {permissionsData?.map((permission) => (
                    <FormField
                      key={permission.id}
                      control={form.control}
                      name="permissionIds"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="w-4 h-4"
                              checked={field.value?.includes(permission.id)}
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, permission.id]);
                                } else {
                                  field.onChange(
                                    current.filter(
                                      (id) => id !== permission.id,
                                    ),
                                  );
                                }
                              }}
                              disabled={disabled}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            {permission.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

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
