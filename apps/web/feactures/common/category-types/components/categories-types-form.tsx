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
import { useForm } from 'react-hook-form';
import { useCategoryTypeMutation } from '../hooks/use-mutation-category-types';
import {
  CategoryTypes,
  categoryTypesSchema,
} from '../schemas/category-types-schemas';
import { useOptionsStore } from '../store/use-options-store';

interface CategoriesTypesFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<CategoryTypes>;
  group: string; // Add group prop
}

export function CategoriesTypesForm({
  onSuccess,
  onCancel,
  defaultValues,
  group, // Destructure group from props
}: CategoriesTypesFormProps) {
  const showOptions = useOptionsStore((state) => state.showOptions);
  const {
    mutate: saveCategoriesTypes,
    isPending: isSaving,
    isError,
  } = useCategoryTypeMutation();

  const form = useForm<CategoryTypes>({
    resolver: zodResolver(categoryTypesSchema),
    defaultValues: {
      group: group, // Use the group prop instead of defaultValues
      description: defaultValues?.description || '',
      options: defaultValues?.options,
      id: defaultValues?.id,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: CategoryTypes) => {
    const transformedData = {
      ...data,
      group:
        data.group === 'FRECUENCIA NOMINA'
          ? 'DISCOUNT_FREQ'
          : data.group === 'TIPO ASOCIADO'
            ? 'ASSOCIATED_TYPE'
            : data.group, // Transformar el grupo según la lógica deseada
      options: data.options ? [{ frequency: String(data.options) }] : null, // Asegurar que options sea un array con el formato esperado
    };

    saveCategoriesTypes(transformedData, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar la cuenta contable',
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
        <div className="grid grid-cols-1 gap-4">
          {/* Remove the group FormField */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showOptions && (
            <FormField
              control={form.control}
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Días Frecuencia</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} // Mantener el valor como número
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
