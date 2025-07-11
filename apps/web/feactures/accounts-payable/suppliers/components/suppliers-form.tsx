'use client';

import { useStatesQuery } from '@/feactures/common/states/hooks/use-querys-states';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
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
import { ScrollArea } from '@repo/shadcn/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { useForm } from 'react-hook-form';
import { useSupplierMutation } from '../hooks/use-mutation-suppliers';
import {
  ESTATUS_TYPES,
  SUPPLIER_CATEGORY_TYPES,
} from '../schemas/suppliers-options';
import { Supplier, supplierSchema } from '../schemas/suppliers.schema';

interface FormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<Supplier>;
  readOnly?: boolean;
}

export function SupplierForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: FormProps) {
  const { mutate: saveSupplier, isPending: isSaving } = useSupplierMutation();
  const { data: StatesQuery } = useStatesQuery();

  const form = useForm<Supplier>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      id: defaultValues?.id,
      companyId: defaultValues?.companyId || 1, // Assuming a default companyId
      code: defaultValues?.code || '',
      name: defaultValues?.name || '',
      taxId: defaultValues?.taxId || '',
      contactName: defaultValues?.contactName || '',
      contactEmail: defaultValues?.contactEmail || '',
      contactPhone: defaultValues?.contactPhone || '',
      state: defaultValues?.state,
      address: defaultValues?.address || '',
      category: defaultValues?.category || SUPPLIER_CATEGORY_TYPES.OTHERS, // Default category
      status: defaultValues?.status || ESTATUS_TYPES.ACTIVE, // Default status
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: Supplier) => {
    saveSupplier(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: (error) => {
        form.setError('root', {
          type: 'manual',
          message: error.message || 'Error al guardar el proveedor',
        });
      },
    });
  };

  const handleTaxIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.toUpperCase().replace(/[^JGCV0-9-]/g, '');

    if (value.length > 0 && !/^[JGCV]/.test(value)) {
      value = ''; // Only allow J, G, C, V as first character
    }

    if (value.length > 1 && value[1] !== '-') {
      value = value[0] + '-' + value.substring(1).replace(/^-/, '');
    }

    if (value.length > 10 && value[10] !== '-') {
      value =
        value.substring(0, 10) + '-' + value.substring(10).replace(/^-/, '');
    }

    if (value.length > 12) {
      value = value.substring(0, 12);
    }

    form.setValue('taxId', value, { shouldValidate: true });
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value.toUpperCase();
    const prefix = 'PROV';

    if (!value.startsWith(prefix)) {
      value = prefix; // Ensure it always starts with PROV
    }

    // Allow only digits after the prefix
    const numericPart = value.substring(prefix.length).replace(/\D/g, '');

    // Limit to 4 digits
    const formattedNumericPart = numericPart.substring(0, 4);

    value = prefix + formattedNumericPart;

    form.setValue('code', value, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 h-full"
        >
          {form.formState.errors.root && (
            <div className="text-destructive text-sm">
              {form.formState.errors.root.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || 'PROV'} // Set default value for display
                      onChange={handleCodeChange}
                      maxLength={8} // PROV + 4 digits
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
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
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
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
                  <FormLabel>Identificación Fiscal (RIF)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleTaxIdChange}
                      maxLength={12} // Max length including hyphens
                      disabled={readOnly}
                      placeholder="J-12345678-9"
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={readOnly}
                      className={readOnly ? 'bg-muted' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* Assuming 'state' is a simple number input for now, adjust if it's a searchable select */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Ubicación</FormLabel>

                  <SelectSearchable
                    options={
                      StatesQuery?.map((item) => ({
                        value: item.id!.toString(),
                        label: `${item.name}`,
                      })) || []
                    }
                    onValueChange={(value) => field.onChange(Number(value))}
                    placeholder="Selecciona un estado"
                    defaultValue={field.value?.toString()}
                    disabled={readOnly}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
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
              name="category"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={readOnly}
                  >
                    <SelectTrigger
                      className={readOnly ? 'bg-muted w-full' : 'w-full'}
                    >
                      <SelectValue placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SUPPLIER_CATEGORY_TYPES).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
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
            {defaultValues && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Estatus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={readOnly}
                    >
                      <FormControl>
                        <SelectTrigger
                          className={readOnly ? 'bg-muted w-full' : 'w-full'}
                        >
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full min-w-[200px]">
                        {Object.entries(ESTATUS_TYPES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <div className="sticky bottom-0 w-full bg-background py-2 px-6 mt-auto">
            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button" onClick={onCancel}>
                {readOnly ? 'Cerrar' : 'Cancelar'}
              </Button>
              {!readOnly && (
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
    </Form>
  );
}
