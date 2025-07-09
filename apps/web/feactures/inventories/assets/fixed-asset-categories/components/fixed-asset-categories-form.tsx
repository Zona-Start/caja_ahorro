import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/components/ui/select';
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
import { useFixedAssetCategoriesMutation } from '../hooks/use-mutation-fixed-asset-categories';
import {
  FixedAssetCategories,
  fixedAssetCategoriesSchema,
} from '../schemas/fixed-asset-categories.schema';

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: Partial<FixedAssetCategories>;
  readOnly?: boolean;
}

export default function FixedAssetCategoriesForm({
  onSuccess,
  onCancel,
  defaultValues,
  readOnly = false,
}: Props) {
  const { mutate: saveFixedAssetCategories, isPending: isSaving } =
    useFixedAssetCategoriesMutation();

  const form = useForm<FixedAssetCategories>({
    resolver: zodResolver(fixedAssetCategoriesSchema),
    defaultValues: {
      id: defaultValues?.id,
      name: defaultValues?.name,
      description: defaultValues?.description || '',
      defaultDepreciationMethod: defaultValues?.defaultDepreciationMethod || '',
      defaultUsefulLifeYears: defaultValues?.defaultUsefulLifeYears,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: FixedAssetCategories) => {
    saveFixedAssetCategories(data, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
      onError: () => {
        form.setError('root', {
          type: 'manual',
          message: 'Error al guardar el tipo de categoria',
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
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
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
          <FormField
            control={form.control}
            name="defaultUsefulLifeYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vida útil (Años) </FormLabel>
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
          <FormField
            control={form.control}
            name="defaultDepreciationMethod"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Categoría</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={String(field.value)}
                  disabled={readOnly}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un frecuencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="w-full min-w-[200px] max-h-[200px] overflow-y-auto">
                    <SelectItem
                      value="Línea recta"
                      className={readOnly ? 'bg-muted' : ''}
                    >
                      Línea recta
                    </SelectItem>
                    <SelectItem
                      value="Suma de los dígitos de los años"
                      className={readOnly ? 'bg-muted' : ''}
                    >
                      Suma de los dígitos de los años
                    </SelectItem>
                    <SelectItem
                      value="Reducción de saldos"
                      className={readOnly ? 'bg-muted' : ''}
                    >
                      Reducción de saldos
                    </SelectItem>
                    <SelectItem
                      value="Unidades de producción"
                      className={readOnly ? 'bg-muted' : ''}
                    >
                      Unidades de producción
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
