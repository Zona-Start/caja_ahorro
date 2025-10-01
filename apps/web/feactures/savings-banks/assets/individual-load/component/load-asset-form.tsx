'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
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
import { Textarea } from '@repo/shadcn/textarea';
import { Check, Loader2, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Associates } from '../schemas/individual-load-api-schema';
import { ASSOCIATE_MOVEMENT_TYPES } from '../schemas/individual-load-options';
import { formSchema, LoadAssest } from '../schemas/individual-load-schema';

interface LoadAssetsFormProps {
  selectedAssociate: Associates | null;
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
}

export function LoadAssetsForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
}: LoadAssetsFormProps) {
  // Inicializar el formulario

  const { currencies } = useSystemConfigStore();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      associateAccountId: 0,
      movementType: 'SAVING_CONTRIBUTION',
      amount: 0,
      currencyCode: 'VES',
      transactionDate: new Date(),
      description: '',
      referenceId: '',
      referenceType: '',
    },
  });

  const [selectedGroup, setSelectedGroup] = useState('SAVING_CONTRIBUTION');

  // Actualizar el associateAccountId cuando cambia el asociado seleccionado
  useEffect(() => {
    if (selectedAssociate) {
      form.setValue(
        'associateAccountId',
        selectedAssociate.associateAccountsId,
      );
    } else {
      form.setValue('associateAccountId', undefined);
    }
  }, [selectedAssociate, form]);

  // Función para manejar el envío del formulario
  const handleSubmit = form.handleSubmit((data: LoadAssest) => {
    const dataTransform = {
      ...data,
      referenceType: null,
      referenceId: null,
      movementType: selectedGroup,
    };
    onSubmit(dataTransform);

    // Resetear el formulario pero mantener el asociado seleccionado
    form.reset({
      associateAccountId: 0,
      movementType: 'SAVING_CONTRIBUTION',
      amount: 0,
      currencyCode: 'VES',
      transactionDate: new Date(),
      description: '',
      referenceId: '',
      referenceType: '',
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <PlusCircle />
          </IconWrapper>
          Datos del Depósito
        </CardTitle>
        <CardDescription>
          Complete la información para registrar el depósito
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="movementType"
              render={({ field }) => (
                <FormItem className="col-span-2 w-full">
                  <FormLabel>Tipo de Movimiento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      setSelectedGroup(value);
                      field.onChange(value);
                    }}
                    value={field.value}
                    disabled={!selectedAssociate || isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ASSOCIATE_MOVEMENT_TYPES).map(
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

            <FormField
              control={form.control}
              name="currencyCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedAssociate || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.name}
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
              name="transactionDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Fecha del Movimiento</FormLabel>
                  <FormControl>
                    <CustomCalendar
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione la fecha"
                      disabled={!selectedAssociate || isSubmitting}
                      className={!selectedAssociate ? 'bg-muted' : ''}
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
                    <Textarea
                      placeholder="Detalles adicionales sobre el movimiento..."
                      className="resize-none"
                      {...field}
                      disabled={!selectedAssociate || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      disabled={!selectedAssociate || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedAssociate || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Registrar Movimiento
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
