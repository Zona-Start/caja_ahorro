import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';
import { Textarea } from '@repo/shadcn/textarea';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
} from '../hooks/use-sales-mutations';
import {
  customerFormSchema,
  toCustomerPayload,
  type Customer,
  type CustomerForm,
} from '../schemas/sales.schema';

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onCreated?: (customer: Customer) => void;
}

function splitName(name?: string | null) {
  if (!name) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = name.split(' ');
  return { firstName, lastName: rest.join(' ') };
}

export function CustomerModal({
  open,
  onOpenChange,
  customer,
  onCreated,
}: CustomerModalProps) {
  const isEdit = !!customer?.id;
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { firstName: '', lastName: '', taxId: '', phone: '', address: '', email: '' },
  });

  useEffect(() => {
    if (!open) return;
    const { firstName, lastName } = splitName(customer?.name);
    form.reset({
      firstName,
      lastName,
      taxId: customer?.taxId ?? '',
      phone: customer?.phone ?? '',
      address: customer?.address ?? '',
      email: customer?.email ?? '',
    });
  }, [open, customer, form]);

  const onSubmit = (data: CustomerForm) => {
    const payload = toCustomerPayload(data);
    if (isEdit && customer) {
      updateMutation.mutate(
        { id: customer.id, payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
      return;
    }
    createMutation.mutate(payload, {
      onSuccess: (created) => {
        onCreated?.(created);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Actualiza los datos del cliente.'
              : 'Registra un cliente con datos simples: nombre, cédula y contacto.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: María" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cédula / RIF</FormLabel>
                    <FormControl>
                      <Input placeholder="V-12345678" {...field} />
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
                      <Input placeholder="0412-0000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección corta</FormLabel>
                  <FormControl>
                    <Textarea
                      className="resize-none"
                      placeholder="Calle, sector, referencia"
                      {...field}
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
                  <FormLabel>Correo (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="cliente@correo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
