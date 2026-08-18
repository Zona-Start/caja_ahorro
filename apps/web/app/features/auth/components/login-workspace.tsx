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
import { toast } from '@repo/shadcn/hooks/use-toast';
import { Input } from '@repo/shadcn/input';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useLoginMutation } from '../hooks/mutation';
import { emailPasswordSchema, type EmailPasswordValue } from '../schemas/login';
import { BrandHeader } from './brand-header';

interface LoginWorkspaceProps {
  prefilledEmail?: string;
}

export function LoginWorkspace({ prefilledEmail }: LoginWorkspaceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const form = useForm<EmailPasswordValue>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: { email: prefilledEmail ?? '', password: '' },
  });

  const { mutate: loginMutation, isPending } = useLoginMutation();

  const onSubmit = async (data: EmailPasswordValue) => {
    setError(null);
    setLoading(true);

    loginMutation(
      { identifier: data.email, password: data.password },
      {
        onSuccess: () => {
          toast({
            title: 'Bienvenido',
            description: 'Inicio de sesión exitoso',
          });
          navigate('/dashboard');
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message === 'Invalid credentials'
              ? 'Credenciales inválidas'
              : 'Contacte al Administrador',
          );
        },
        onSettled: () => setLoading(false),
      },
    );
  };

  return (
    <div className="p-6 md:p-8">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <BrandHeader
            title="Bienvenido"
            subtitle="Ingrese su contraseña para continuar"
          />

          <div className="grid gap-2">
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
          </div>

          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="*************"
                        disabled={loading}
                        autoComplete="current-password"
                        {...field}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {error && <FormMessage className="text-red-500">{error}</FormMessage>}

          <Button
            disabled={loading || isPending}
            type="submit"
            className="w-full"
          >
            Ingresar
          </Button>
        </form>
      </Form>
    </div>
  );
}
