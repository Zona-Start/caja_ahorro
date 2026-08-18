import { getPlatformDomain } from '@/lib/host-resolver';
import { storageService } from '@/lib/storage-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ModuleCode } from '../constants/modules-constants';
import { MODULE_LABELS } from '../constants/modules-constants';
import { useSaveTenantMutation } from '../hooks/use-tenants-mutations';
import { useTenantModulesQuery } from '../hooks/use-tenants-queries';
import {
  type TenantMutation,
  tenantMutationSchema,
} from '../schemas/tenants.schema';
import { ImageUploadField } from './image-upload-field';

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
  const { toast } = useToast();

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const isEditing = !!defaultValues?.id;
  const { data: modules = [] } = useTenantModulesQuery(
    defaultValues?.id ?? '',
    isEditing,
  );

  const activeModuleCodes = modules
    .filter((m) => m.status === 'ENABLED')
    .map((m) => m.moduleCode);

  const form = useForm<TenantMutation>({
    resolver: zodResolver(tenantMutationSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name || '',
      rif: defaultValues?.rif || '',
      email: defaultValues?.email || '',
      businessType: defaultValues?.businessType || 'CAJA_AHORRO',
      address: defaultValues?.address || '',
      phone: defaultValues?.phone || '',
      contactName: defaultValues?.contactName || '',
      contactPhone: defaultValues?.contactPhone || '',
      contactEmail: defaultValues?.contactEmail || '',
      contactCedula: defaultValues?.contactCedula || '',
      slug: defaultValues?.slug || '',
      customDomain: defaultValues?.customDomain || '',
      logoKey: defaultValues?.logoKey || '',
      logoUrl: defaultValues?.logoUrl || '',
      faviconKey: defaultValues?.faviconKey || '',
      faviconUrl: defaultValues?.faviconUrl || '',
      primaryColor: defaultValues?.primaryColor || '',
      secondaryColor: defaultValues?.secondaryColor || '',
      loginMode: defaultValues?.loginMode || 'SUBDOMAIN',
      moduleCodes: isEditing ? (activeModuleCodes as any) : undefined,
      isActive: defaultValues?.isActive ?? true,
    },
  });

  const watchedSlug = form.watch('slug');
  const watchedLogoUrl = form.watch('logoUrl');
  const watchedFaviconUrl = form.watch('faviconUrl');

  useEffect(() => {
    if (isEditing && activeModuleCodes.length > 0) {
      form.setValue('moduleCodes', activeModuleCodes as any);
    }
  }, [isEditing, activeModuleCodes.length]);

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    try {
      const { key, url } = await storageService.upload(file, 'logos');
      form.setValue('logoKey', key, { shouldValidate: true });
      form.setValue('logoUrl', url, { shouldValidate: true });
      toast({
        title: 'Logo cargado',
        description: 'La imagen se guardó correctamente.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo subir el logo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (file: File) => {
    setUploadingFavicon(true);
    try {
      const { key, url } = await storageService.upload(file, 'favicons');
      form.setValue('faviconKey', key, { shouldValidate: true });
      form.setValue('faviconUrl', url, { shouldValidate: true });
      toast({
        title: 'Favicon cargado',
        description: 'La imagen se guardó correctamente.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo subir el favicon.',
        variant: 'destructive',
      });
    } finally {
      setUploadingFavicon(false);
    }
  };

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
        <input type="hidden" {...form.register('logoKey')} />
        <input type="hidden" {...form.register('logoUrl')} />
        <input type="hidden" {...form.register('faviconKey')} />
        <input type="hidden" {...form.register('faviconUrl')} />
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
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cliente</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={disabled || !!defaultValues?.id}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAJA_AHORRO">
                        Caja de Ahorro
                      </SelectItem>
                      <SelectItem value="EMPRESA_COMERCIAL">
                        Empresa Comercial
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3">Acceso y Marca</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Espacio de trabajo (subdominio)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ferreteria"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {watchedSlug
                      ? `Acceso: ${watchedSlug}.${getPlatformDomain()}`
                      : `Será accesible en <espacio>.${getPlatformDomain()}`}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customDomain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dominio personalizado</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="app.miempresa.com"
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Opcional. Requiere verificación DNS.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loginMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo de acceso</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione modo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUBDOMAIN">Subdominio</SelectItem>
                        <SelectItem value="CUSTOM_DOMAIN">
                          Dominio personalizado
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <ImageUploadField
                label="Logo"
                value={watchedLogoUrl}
                onChange={handleLogoUpload}
                uploading={uploadingLogo}
                disabled={disabled}
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
              />
            </div>

            <div className="space-y-2">
              <ImageUploadField
                label="Favicon"
                value={watchedFaviconUrl}
                onChange={handleFaviconUpload}
                uploading={uploadingFavicon}
                disabled={disabled}
                accept="image/png,image/x-icon,image/svg+xml"
              />
            </div>

            <FormField
              control={form.control}
              name="primaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color primario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="#2F80ED"
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
              name="secondaryColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color secundario</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="#1D1D1D"
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

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-3">Módulos Disponibles</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Selecciona los módulos que estarán disponibles para este cliente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(Object.entries(MODULE_LABELS) as [ModuleCode, string][]).map(
              ([code, label]) => (
                <FormField
                  key={code}
                  control={form.control}
                  name="moduleCodes"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(code)}
                          onCheckedChange={(checked) => {
                            const current = field.value ?? [];
                            if (checked) {
                              field.onChange([...current, code]);
                            } else {
                              field.onChange(current.filter((v) => v !== code));
                            }
                          }}
                          disabled={disabled}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ),
            )}
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
