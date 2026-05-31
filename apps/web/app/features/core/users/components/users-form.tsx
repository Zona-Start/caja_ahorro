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
import { Switch } from '@repo/shadcn/switch';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useSaveUserMutation } from '../hooks/use-users-mutations';
import {
  useAllPermissions,
  useAvailablePermissions,
  useRolesByTenant,
} from '../hooks/use-users-permissions';
import { type UserMutation, userMutationSchema } from '../schemas/users.schema';

interface UsersFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<UserMutation>;
  disabled?: boolean;
}

export function UsersForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: UsersFormProps) {
  const { user } = useAuthStore();
  const isSystemAdmin = user?.isSystemAdmin ?? false;
  const activeTenantId = user?.activeTenantId ?? null;

  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    isSystemAdmin ? defaultValues?.tenantId || '' : activeTenantId || '',
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string>(
    defaultValues?.roleId || '',
  );
  const [showSpecialPermissions, setShowSpecialPermissions] = useState(
    !!(defaultValues?.specialPermissionIds?.length ?? 0),
  );

  const { data: tenantsData } = useTenantsQuery(
    {
      page: 1,
      limit: 100,
      search: '',
      isActive: 'true',
    },
    isSystemAdmin
  );

  const editingTenantId = defaultValues?.tenantId || '';
  const effectiveTenantId = isSystemAdmin
    ? selectedTenantId || editingTenantId
    : (editingTenantId || activeTenantId || '');

  const { data: rolesData, isLoading: isLoadingRoles } = useRolesByTenant(
    effectiveTenantId,
    !!effectiveTenantId,
  );

  const { data: allPermissions, isLoading: isLoadingAllPermissions } =
    useAllPermissions(!!effectiveTenantId);

  const {
    data: availablePermissions,
    isLoading: isLoadingPermissions,
    error: permissionsError,
  } = useAvailablePermissions(selectedRoleId || null, !!selectedRoleId);

  const permissionsToShow = selectedRoleId
    ? availablePermissions
    : allPermissions;
  const isLoadingPerms = selectedRoleId
    ? isLoadingPermissions
    : isLoadingAllPermissions;

  const { mutate: saveUser, isPending: isSaving } = useSaveUserMutation();

  const form = useForm<UserMutation>({
    resolver: zodResolver(userMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      username: defaultValues?.username || '',
      password: defaultValues?.password || '',
      fullname: defaultValues?.fullname || '',
      email: defaultValues?.email || '',
      status: defaultValues?.status || 'active',
      isSystemAdmin: defaultValues?.isSystemAdmin || false,
      tenantId: isSystemAdmin
        ? defaultValues?.tenantId || ''
        : activeTenantId || '',
      roleId: defaultValues?.roleId || '',
      specialPermissionIds: defaultValues?.specialPermissionIds || [],
    },
  });

  useEffect(() => {
    if (isSystemAdmin && selectedTenantId) {
      form.setValue('tenantId', selectedTenantId);
    }
  }, [selectedTenantId, isSystemAdmin, form]);

  useEffect(() => {
    if (selectedRoleId) {
      form.setValue('roleId', selectedRoleId);
    }
  }, [selectedRoleId, form]);

  useEffect(() => {
    if (defaultValues?.roleId && !selectedRoleId) {
      setSelectedRoleId(defaultValues.roleId);
    }
  }, [defaultValues?.roleId]);

  const onSubmit = (data: UserMutation) => {
    const isAdmin = data.isSystemAdmin === true;
    let submitData: UserMutation;

    if (isAdmin) {
      submitData = {
        ...data,
        tenantId: undefined,
        roleId: undefined,
        specialPermissionIds: [],
        isSystemAdmin: true,
      };
    } else {
      submitData = {
        ...data,
        tenantId: data.tenantId,
        isSystemAdmin: false,
      };
    }
    saveUser(submitData, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const handleSystemAdminChange = (checked: boolean) => {
    form.setValue('isSystemAdmin', checked);
    if (checked) {
      form.setValue('tenantId', undefined);
      form.setValue('roleId', undefined);
      form.setValue('specialPermissionIds', []);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuario</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre de usuario"
                    {...field}
                    disabled={disabled || !!defaultValues?.id}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!defaultValues?.id && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Contraseña"
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
            name="fullname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre completo"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="correo@ejemplo.com"
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isSystemAdmin && (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedTenantId(value);
                      setSelectedRoleId('');
                    }}
                    value={field.value}
                    disabled={disabled || form.watch('isSystemAdmin')}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tenant" />
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
            name="roleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedRoleId(value);
                    form.setValue('specialPermissionIds', []);
                  }}
                  value={field.value}
                  disabled={
                    disabled ||
                    isLoadingRoles ||
                    !effectiveTenantId ||
                    form.watch('isSystemAdmin')
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rolesData?.data?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isSystemAdmin && (
            <FormField
              control={form.control}
              name="isSystemAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Administrador del Sistema
                    </FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={field.value}
                      onChange={(e) =>
                        handleSystemAdminChange(e.target.checked)
                      }
                      disabled={disabled}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
        </div>

        {!disabled && !form.watch('isSystemAdmin') && (
          <div className="border-t pt-4 mt-4">
            <FormField
              control={form.control}
              name="specialPermissionIds"
              render={() => (
                <FormItem>
                  <div className="flex items-center justify-between mb-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Permisos Especiales
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Agregar permisos adicionales oltre los del rol
                      </p>
                    </div>
                    <Switch
                      checked={showSpecialPermissions}
                      onCheckedChange={setShowSpecialPermissions}
                    />
                  </div>

                  {showSpecialPermissions && (
                    <>
                      {isLoadingPerms ? (
                        <div className="text-sm text-muted-foreground">
                          Cargando permisos...
                        </div>
                      ) : permissionsError ? (
                        <div className="text-sm text-red-500">
                          Error al cargar permisos. Intente de nuevo.
                        </div>
                      ) : permissionsToShow && permissionsToShow.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                          {permissionsToShow.map((permission) => (
                            <FormField
                              key={permission.id}
                              control={form.control}
                              name="specialPermissionIds"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4"
                                      checked={field.value?.includes(
                                        permission.id,
                                      )}
                                      onChange={(e) => {
                                        const current = field.value || [];
                                        if (e.target.checked) {
                                          field.onChange([
                                            ...current,
                                            permission.id,
                                          ]);
                                        } else {
                                          field.onChange(
                                            current.filter(
                                              (id) => id !== permission.id,
                                            ),
                                          );
                                        }
                                      }}
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
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No hay permisos disponibles.
                        </div>
                      )}
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

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
