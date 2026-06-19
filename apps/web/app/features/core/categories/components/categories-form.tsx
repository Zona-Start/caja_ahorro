import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
import { TENANTS_KEYS } from '../../tenants/keys/tenants-keys';
import { tenantsService } from '../../tenants/services/tenants-service';
import type { Tenant } from '../../tenants/schemas/tenants.schema';
import { useSaveCategoryMutation } from '../hooks/use-categories-mutations';
import {
  type CategoryMutation,
  categoryMutationSchema,
  CATEGORY_TYPES,
  TYPE_LABELS,
} from '../schemas/categories.schema';

interface CategoriesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<CategoryMutation>;
  disabled?: boolean;
}

export function CategoriesForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: CategoriesFormProps) {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { mutate: saveCategory, isPending: isSaving } = useSaveCategoryMutation();

  const form = useForm<CategoryMutation>({
    resolver: zodResolver(categoryMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      type: defaultValues?.type || '',
      code: defaultValues?.code || '',
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      isActive: defaultValues?.isActive ?? true,
      tenantId: defaultValues?.tenantId || '',
    },
    mode: 'onChange',
  });

  const watchedName = form.watch('name');
  const watchedType = form.watch('type');

  const isPayrollType = watchedType === CATEGORY_TYPES.PAYROLL_TYPE;

  useEffect(() => {
    if (!isPayrollType && watchedName) {
      const generatedCode = watchedName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      form.setValue('code', generatedCode, { shouldValidate: true });
    }
  }, [watchedName, isPayrollType, form]);

  useEffect(() => {
    if (isPayrollType) {
      form.setValue('code', defaultValues?.code || '', { shouldValidate: true });
    }
  }, [isPayrollType, defaultValues?.code, form]);

  const onSubmit = async (data: CategoryMutation) => {
    saveCategory(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  const categoryTypeValues = Object.values(CATEGORY_TYPES);

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const tenantOptions = useMemo(
    () =>
      (tenantsData?.data ?? []).map((t: Tenant) => ({
        value: t.id,
        label: t.name,
      })),
    [tenantsData],
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryTypeValues.map((value) => (
                      <SelectItem key={value} value={value}>
                        {TYPE_LABELS[value] || value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isPayrollType ? (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                  <Input {...field} disabled={disabled} />
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
                  <Input {...field} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === 'true')}
                  value={String(field.value ?? true)}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Activo</SelectItem>
                    <SelectItem value="false">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isSuperAdmin && (
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={disabled || !!defaultValues?.id}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tenantOptions.map((opt: { value: string; label: string }) => (
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

        {disabled ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onCancel}>
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
