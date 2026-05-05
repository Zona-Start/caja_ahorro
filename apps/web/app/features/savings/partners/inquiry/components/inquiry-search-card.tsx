import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Input } from '@repo/shadcn/input';

const searchSchema = z.object({
  cedula: z.string().min(1, 'La cédula es requerida.'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface InquirySearchCardProps {
  onSearch: (cedula: string) => void;
  isLoading: boolean;
}

export function InquirySearchCard({
  onSearch,
  isLoading,
}: InquirySearchCardProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      cedula: '',
    },
  });

  const onSubmit = (values: SearchFormValues) => {
    onSearch(values.cedula);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Asociado</CardTitle>
        <CardDescription>
          Ingrese la cédula del asociado para consultar su estado de cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-end gap-4"
          >
            <FormField
              control={form.control}
              name="cedula"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Cédula de Identidad</FormLabel>
                  <FormControl>
                    <Input className="mt-4" placeholder="12345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Buscar
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
