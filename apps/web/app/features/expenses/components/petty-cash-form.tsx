import { useUsersQuery } from '@/features/core/users/hooks/use-users-queries';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Switch } from '@repo/shadcn/switch';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useCreatePettyCashMutation } from '../hooks/use-petty-cash-queries';
import {
  pettyCashFormSchema,
  type PettyCashForm,
} from '../schemas/petty-cash.schema';

interface PettyCashFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PettyCashForm({ onSuccess, onCancel }: PettyCashFormProps) {
  const createMutation = useCreatePettyCashMutation();
  const { data: usersData } = useUsersQuery({ page: 1, limit: 100 });
  const users = useMemo(() => usersData?.data ?? [], [usersData]);

  const form = useForm<PettyCashForm>({
    resolver: zodResolver(pettyCashFormSchema),
    defaultValues: {
      isActive: true,
      name: '',
      currencyCode: 'VES',
      assignedAmount: undefined as unknown as number,
      custodianUserId: '',
    },
  });

  const onSubmit = (data: PettyCashForm) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Caja Chica Oficina Central"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="custodianUserId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custodio Responsable</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el usuario custodio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assignedAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Asignado</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currencyCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="VES">VES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Fondo Activo</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Guardando...' : 'Crear Fondo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
