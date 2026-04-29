import { authService } from '@/lib/auth-service';
import { loginSchema, type LoginInput } from '@/lib/schemas';
import { useAuthStore } from '@/stores/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { useToast } from '@repo/shadcn/hooks/use-toast';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { redirect, useNavigate, useNavigation } from 'react-router';

export function meta() {
  return [{ title: 'Login | Caja de Ahorro' }];
}

/**
 * If the user is already authenticated, redirect straight to the dashboard.
 * This prevents showing the login form to already-logged-in users.
 */
export function clientLoader() {
  const { isAuthenticated } = useAuthStore.getState();
  if (isAuthenticated) {
    throw redirect('/dashboard');
  }
  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: (data: LoginInput) => authService.login(data),
    onSuccess: () => {
      toast({ title: 'Bienvenido', description: 'Inicio de sesión exitoso' });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Error de autenticación',
        description:
          error?.response?.data?.message ?? 'Credenciales inválidas',
        variant: 'destructive',
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  const isPending = loginMutation.isPending || isNavigating;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingrese sus credenciales para acceder a su cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="login-username">Usuario</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="tu.usuario"
                autoComplete="username"
                {...register('username')}
                disabled={isPending}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
                disabled={isPending}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              id="login-submit"
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
