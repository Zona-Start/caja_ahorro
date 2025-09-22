import { Card, CardContent } from '@repo/shadcn/card';
import { cn } from '@repo/shadcn/lib/utils';
import UserAuthForm from './user-auth-form';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="overflow-hidden border-0">
        <CardContent className="grid p-0 md:grid-cols-2 ">
          <UserAuthForm />
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Desarrollado por <a href="https://zonastart.com">Zona Start</a>
      </div>
    </div>
  );
}
