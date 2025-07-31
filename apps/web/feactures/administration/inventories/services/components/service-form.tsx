import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Textarea } from '@repo/shadcn/components/ui/textarea';
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
import { useForm } from 'react-hook-form';
import { useSupplierAll } from '../../../suppliers/hooks/use-query-suppliers';
import { useServiceMutation } from '../hooks/use-mutation-service';
import { SERVICE_STATUS_TYPES } from '../schemas/service-options';
import { Service, serviceSchema } from '../schemas/service.schema';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Service>;
  readOnly?: boolean;
}

export default function ServiceForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: Props) {
  const { mutate: saveService, isPending: isSaving } = useServiceMutation();

  const { data: dataSuppliers } = useSupplierAll();

  const form = useForm<Service>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      ...defaultValues,
      defaultCost: defaultValues?.defaultCost ?? 0,
      suppliersId: defaultValues?.suppliersId ?? undefined,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Service) => {
    saveService(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el servicio',
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="suppliersId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Proveedor</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    {dataSuppliers?.map((item: any) => (
                      <SelectItem
                        key={item.id}
                        value={item.id!.toString()}
                        className={readOnly ? 'bg-muted' : ''}
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="defaultCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo por Defecto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    value={field.value ?? ''}
                    disabled={readOnly}
                    className={readOnly ? 'bg-muted' : ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {defaultValues?.id && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Estatus</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                    disabled={readOnly}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-full min-w-[200px]">
                      {Object.entries(SERVICE_STATUS_TYPES).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="sticky bottom-0 w-full bg-background  py-2 px-6 mt-auto">
          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
