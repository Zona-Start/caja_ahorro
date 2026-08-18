import { useTenantStore } from '@/stores/tenant.store';
import { Card, CardContent } from '@repo/shadcn/card';
import { cn } from '@repo/shadcn/lib/utils';
import { useSearchParams } from 'react-router';
import { LoginCustomDomain } from './login-custom-domain';
import { LoginEmailEntry } from './login-email-entry';
import { LoginWorkspace } from './login-workspace';

function Loading() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center px-6 text-center text-muted-foreground">
      {message}
    </div>
  );
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const type = useTenantStore((s) => s.type);
  const tenant = useTenantStore((s) => s.tenant);
  const isResolving = useTenantStore((s) => s.isResolving);
  const [searchParams] = useSearchParams();
  const prefilledEmail = searchParams.get('email') ?? undefined;

  const renderContent = () => {
    if (isResolving) {
      return <Loading />;
    }

    if (type === 'subdomain') {
      if (!tenant) {
        return <ErrorMessage message="Espacio de trabajo no encontrado" />;
      }
      return <LoginWorkspace prefilledEmail={prefilledEmail} />;
    }

    if (type === 'custom') {
      if (!tenant) {
        return <ErrorMessage message="Dominio no configurado" />;
      }
      return <LoginCustomDomain />;
    }

    return <LoginEmailEntry />;
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden border-0">
        <CardContent className="grid p-0 md:min-w-[28rem]">
          {renderContent()}
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Desarrollado por <a href="https://zonastart.com">Zona Start</a>
      </div>
    </div>
  );
}
