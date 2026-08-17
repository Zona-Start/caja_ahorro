import { buildCustomDomainUrl, buildSubdomainUrl } from '@/lib/host-resolver';
import type { TenantBrand } from '@/stores/tenant.store';
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
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { emailOnlySchema, type EmailOnlyValue } from '../schemas/login';
import { authService } from '../services/auth-service';
import { BrandHeader } from './brand-header';

export function LoginEmailEntry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantBrand[] | null>(null);
  const navigate = useNavigate();

  const form = useForm<EmailOnlyValue>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: '' },
  });

  const redirectToTenant = (tenant: TenantBrand) => {
    const email = form.getValues('email');
    const query = `?email=${encodeURIComponent(email)}`;

    if (tenant.loginMode === 'CUSTOM_DOMAIN' && tenant.customDomain) {
      window.location.assign(
        `${buildCustomDomainUrl(tenant.customDomain)}/login`,
      );
      return;
    }

    if (tenant.slug) {
      window.location.assign(`${buildSubdomainUrl(tenant.slug)}/login${query}`);
      return;
    }

    navigate('/login');
  };

  const onSubmit = async (data: EmailOnlyValue) => {
    setError(null);
    setTenants(null);
    setLoading(true);

    try {
      const result = await authService.lookupWorkspace(data.email);

      if (result.tenants.length === 0) {
        setError('No encontramos un espacio de trabajo para este correo.');
        return;
      }

      if (result.tenants.length === 1) {
        redirectToTenant(result.tenants[0]!);
        return;
      }

      setTenants(result.tenants);
    } catch {
      setError('No fue posible validar el correo. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col gap-6">
        <BrandHeader
          title="Iniciar sesión"
          subtitle="Ingrese su correo para continuar"
        />

        {tenants && tenants.length > 1 ? (
          <div className="grid gap-3">
            <p className="text-center text-sm text-muted-foreground">
              Seleccione su espacio de trabajo:
            </p>
            {tenants.map((tenant) => (
              <Button
                key={tenant.id}
                type="button"
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={() => redirectToTenant(tenant)}
              >
                <img
                  src={tenant.logoUrl || '/img/logo.png'}
                  alt={tenant.name}
                  className="h-6 w-6"
                />
                <span className="truncate">{tenant.name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="correo@empresa.com"
                        disabled={loading}
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <FormMessage className="text-red-500">{error}</FormMessage>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                Continuar
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}
