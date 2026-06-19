import { useAuthStore } from '@/stores/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Checkbox } from '@repo/shadcn/checkbox';
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
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTenantsQuery } from '../../tenants/hooks/use-tenants-queries';
import { useSaveRoleMutation } from '../hooks/use-roles-mutations';
import { usePermissionsQuery } from '../hooks/use-roles-queries';
import { type RoleMutation, roleMutationSchema } from '../schemas/roles.schema';
import { groupPermissions } from './permission-groups';

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
    { page: 1, limit: 100, isActive: 'true', search: '' },
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

  const watchPermissionIds = form.watch('permissionIds') || [];

  const groupedPermissions = useMemo(
    () => (permissionsData ? groupPermissions(permissionsData) : []),
    [permissionsData],
  );

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
          'No tienes un tenant activo. Contacta al administrador.',
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

  function handleGroupToggle(permissionIds: string[], checked: boolean) {
    const current = watchPermissionIds;
    if (checked) {
      const merged = new Set([...current, ...permissionIds]);
      form.setValue('permissionIds', Array.from(merged), { shouldValidate: true });
    } else {
      form.setValue(
        'permissionIds',
        current.filter((id) => !permissionIds.includes(id)),
        { shouldValidate: true },
      );
    }
  }

  function isGroupFullySelected(permissionIds: string[]): boolean {
    return permissionIds.every((id) => watchPermissionIds.includes(id));
  }

  function isGroupPartiallySelected(permissionIds: string[]): boolean {
    const some = permissionIds.some((id) => watchPermissionIds.includes(id));
    return some && !isGroupFullySelected(permissionIds);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 flex-1 min-h-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
          {isSystemAdmin && (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empresa">
                          {field.value
                            ? tenantsData?.data?.find(
                              (t) => t.id === field.value,
                            )?.name
                            : 'Seleccionar empresa'}
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
            <FormItem className="flex flex-col min-h-0 flex-1">
              <FormLabel>Permisos</FormLabel>
              {isLoadingPermissions ? (
                <div className="text-sm text-muted-foreground">
                  Cargando permisos...
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto rounded-md border p-4">
                  <div className="space-y-4">
                    {groupedPermissions.map((group) => {
                      const groupIds = group.permissions.map((p) => p.id);
                      const allSelected = isGroupFullySelected(groupIds);
                      const partialSelected = isGroupPartiallySelected(groupIds);

                      return (
                        <Card key={group.prefix}>
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) =>
                                  handleGroupToggle(
                                    groupIds,
                                    checked === true,
                                  )
                                }
                                disabled={disabled}
                                aria-label={`Seleccionar todos ${group.label}`}
                              />
                              <CardTitle className="text-sm font-semibold">
                                {group.label}
                              </CardTitle>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {groupIds.filter((id) =>
                                  watchPermissionIds.includes(id),
                                ).length}{' '}
                                / {groupIds.length}
                              </span>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-4 grid grid-cols-1 sm:grid-cols-2 gap-1">
                            {group.permissions.map((permission) => {
                              const checked = watchPermissionIds.includes(
                                permission.id,
                              );
                              return (
                                <FormField
                                  key={permission.id}
                                  control={form.control}
                                  name="permissionIds"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-2 space-y-0 py-1">
                                      <FormControl>
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(c) => {
                                            const current = field.value || [];
                                            if (c) {
                                              field.onChange([
                                                ...current,
                                                permission.id,
                                              ]);
                                            } else {
                                              field.onChange(
                                                current.filter(
                                                  (id) =>
                                                    id !== permission.id,
                                                ),
                                              );
                                            }
                                          }}
                                          disabled={disabled}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer leading-none">
                                        {permission.name}
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              );
                            })}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 shrink-0">
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
