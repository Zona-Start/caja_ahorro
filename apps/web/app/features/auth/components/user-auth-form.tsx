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
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { formSchema, type UserFormValue } from '../schemas/login.ts';
import { useLoginMutation } from '../hooks/mutation.ts';
import { toast } from '@repo/shadcn/hooks/use-toast.ts';
import { Toaster } from '@repo/shadcn/components/ui/toaster.tsx';
import { useNavigate } from 'react-router';
import { Eye, EyeOff } from 'lucide-react';

export default function UserAuthForm() {
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

  const { mutate: loginMutation, isPending } = useLoginMutation();
  const navigate = useNavigate();


  const onSubmit = async (data: UserFormValue) => {
    SetError(null); // Limpia cualquier error previo al intentar iniciar sesión
    startTransition(async () => {
      loginMutation(data, {
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
        }
      });
    });
  }

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
                          type={showPassword ? 'text' : 'password'}
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
          <Toaster />
        </form>
      </Form>
      <div className="relative hidden bg-white md:block border-muted border-2 rounded-lg overflow-hidden">
        <img
          src="/img/logo.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </>
  )
}
