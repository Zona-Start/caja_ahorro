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
import { useForm } from 'react-hook-form';
import { useSaveTenantMutation } from '../hooks/use-tenants-mutations';
import {
  type TenantMutation,
  tenantMutationSchema,
} from '../schemas/tenants.schema';

interface TenantsFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<TenantMutation>;
  disabled?: boolean;
}

export function TenantsForm({
  onSuccess,
  onCancel,
  defaultValues,
  disabled = false,
}: TenantsFormProps) {
  const { mutate: saveTenant, isPending: isSaving } = useSaveTenantMutation();

  const form = useForm<TenantMutation>({
    resolver: zodResolver(tenantMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      rif: defaultValues?.rif || '',
      email: defaultValues?.email || '',
      address: defaultValues?.address || '',
      phone: defaultValues?.phone || '',
      contactName: defaultValues?.contactName || '',
      contactPhone: defaultValues?.contactPhone || '',
      contactEmail: defaultValues?.contactEmail || '',
      contactCedula: defaultValues?.contactCedula || '',
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const onSubmit = (data: TenantMutation) => {
    saveTenant(data, {
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
                    placeholder="Nombre del tenant"
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
            name="rif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RIF</FormLabel>
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
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0412-123-4567"
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
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Dirección</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dirección fiscal"
                    {...field}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3">Información de Contacto</h4>
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
              name="contactCedula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="V-12345678"
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
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0412-123-4567"
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
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contacto@ejemplo.com"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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