import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
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
import { QUERY_KEYS } from '@/lib/query-keys';
import { getStatesAction } from '../../../core/states/services/querys-states';
import { TENANTS_KEYS } from '../../../core/tenants/keys/tenants-keys';
import { tenantsService } from '../../../core/tenants/services/tenants-service';
import { useAuthStore } from '@/stores/auth.store';
import type { Tenant } from '../../../core/tenants/schemas/tenants.schema';
import { CATEGORY_OPTIONS } from '../schemas/suppliers-options';
import { useSaveSupplierMutation } from '../hooks/use-suppliers-mutations';
import {
  type SupplierMutation,
  supplierMutationSchema,
} from '../schemas/suppliers.schema';

interface SuppliersFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<SupplierMutation>;
  disabled?: boolean;
}

export function SuppliersForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: SuppliersFormProps) {
  const { mutate: saveSupplier, isPending: isSaving } =
    useSaveSupplierMutation();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.isSystemAdmin ?? false;

  const { data: tenantsData } = useQuery({
    queryKey: TENANTS_KEYS.list({}),
    queryFn: () => tenantsService.getAll({ limit: 100 }),
    enabled: isSuperAdmin,
  });

  const { data: statesData } = useQuery({
    queryKey: QUERY_KEYS.states.list({}),
    queryFn: () => getStatesAction(),
  });

  const form = useForm<SupplierMutation>({
    resolver: zodResolver(supplierMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      tenantId: defaultValues?.tenantId || '',
      internalCode: defaultValues?.internalCode || '',
      name: defaultValues?.name || '',
      taxId: defaultValues?.taxId || '',
      contactName: defaultValues?.contactName || '',
      contactEmail: defaultValues?.contactEmail || '',
      contactPhone: defaultValues?.contactPhone || '',
      address: defaultValues?.address || '',
      state: defaultValues?.state ?? undefined,
      category: defaultValues?.category || '',
      status: defaultValues?.status || 'ACTIVE',
    },
  });

  const onSubmit = (data: SupplierMutation) => {
    const cleaned = { ...data } as Record<string, unknown>;
    for (const key of ['phone', 'email', 'contactName', 'contactEmail', 'contactPhone', 'address', 'tenantId']) {
      if (cleaned[key] === '') cleaned[key] = undefined;
    }
    saveSupplier(cleaned as SupplierMutation, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {isSuperAdmin && (
          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {tenantsData?.data.map((t: Tenant) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {defaultValues?.id && (
                <FormField
                  control={form.control}
                  name="internalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Interno</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Generado automáticamente"
                          {...field}
                          disabled
                        />
                      </FormControl>
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
                        placeholder="Nombre del proveedor"
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
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificador Fiscal</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="J-12345678-9"
                        {...field}
                        disabled={disabled || !!defaultValues?.id}
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
                      value={field.value}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((option) => (
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0212-123-4567"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                        placeholder="proveedor@ejemplo.com"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ubicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Dirección fiscal"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localidad</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? Number(val) : undefined)}
                      value={field.value?.toString() ?? ''}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statesData?.map((state: { id?: number; name: string }) => (
                          <SelectItem key={state.id ?? state.name} value={String(state.id)}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre completo"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0412-123-4567"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo de Contacto</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contacto@ejemplo.com"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        disabled={disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

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
