'use client';
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
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import { toast, Toaster } from 'sonner';
import { formSchema, UserFormValue } from '../schemas/login';

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  const [error, SetError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const defaultValues = {
    username: '',
    password: '',
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserFormValue) => {
    SetError(null); // Limpia cualquier error previo al intentar iniciar sesión
    startTransition(async () => {
      try {
        const login = await signIn('credentials', {
          username: data.username,
          password: data.password,
          redirect: false, // No queremos una redirección automática aquí
        });

        if (login?.error) {
          const errorMessage =
            login.error === 'CredentialsSignin'
              ? 'Usuario o contraseña incorrectos'
              : 'Contacte al Administrador';
          SetError(errorMessage);
          toast.error(errorMessage);
        }

        // Si la autenticación es exitosa y `redirect: false`, necesitamos redirigir manualmente
        if (login?.ok && !login?.error) {
          toast.success('Ingreso Exitoso!');
          router.push(callbackUrl ?? '/dashboard');
        }
      } catch (error) {
        console.error('Error durante el inicio de sesión:', error);
        toast.error('Hubo un error inesperado');
      }
    });
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">
                {' '}
                Sistema de Cajas de Ahorro
              </h1>
              <p className="text-balance text-muted-foreground">
                Ingrese sus datos para acceder al sistema
              </p>
            </div>
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="ingrese su usuario..."
                        disabled={loading}
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
                          type={showPassword ? "text" : "password"}
                          placeholder="*************"
                          disabled={loading}
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
            {error && (
              <FormMessage className="text-red-500">{error}</FormMessage>
            )}{' '}
            {/* Muestra el error del estado */}
            <Button disabled={loading} type="submit" className="w-full">
              Ingresar
            </Button>
          </div>
          <Toaster richColors />
        </form>
      </Form>
      <div className="relative hidden bg-muted md:block border-muted border-2 rounded-lg overflow-hidden">
        <img
          src="/logo.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </>
  );
}
