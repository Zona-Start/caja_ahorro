'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { AlertModal } from '@/components/modal/alert-modal';
import { useBankAccountAll } from '@/feactures/banks/bank-account/hooks/use-query-bank-account';
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

const PAYMENT_METHODS = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia bancaria',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
};

export function LoadAssetsForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
}: LoadAssetsFormProps) {
  const { currencies } = useSystemConfigStore();
  const { data: bankAccountsData } = useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  const form = useForm<LoadAssest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      associateAccountId: 0,
      movementType: 'SAVING_CONTRIBUTION',
      amount: 0,
      currencyCode: 'VES',
      transactionDate: new Date(),
      description: '',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
    },
  });

  const [selectedGroup, setSelectedGroup] = useState('SAVING_CONTRIBUTION');

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

  const handleSubmit = form.handleSubmit((data: LoadAssest) => {
    const dataTransform = {
      ...data,
      movementType: selectedGroup,
    };
    onSubmit(dataTransform);

    form.reset({
      associateAccountId: 0,
      movementType: 'SAVING_CONTRIBUTION',
      amount: 0,
      currencyCode: 'VES',
      transactionDate: new Date(),
      description: '',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: '',
    });
    setConfirmOpen(false);
  });

  const paymentMethod = form.watch('paymentMethod');

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        loading={isSubmitting}
        title="¿Está seguro que desea registrar el movimiento?"
        description="Esta acción no se puede deshacer."
      />
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="movementType"
                  render={({ field }) => (
                    <FormItem>
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione una moneda" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem
                              key={currency.code}
                              value={currency.code}
                            >
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          defaultValue={field.value}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          disabled={!selectedAssociate || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {paymentMethod !== 'CASH' && (
                <FormField
                  control={form.control}
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuenta Bancaria de la Caja</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                        disabled={!selectedAssociate || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione una cuenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={String(account.id)}
                            >
                              {account.accountName} ({account.accountNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedAssociate || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccione un método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PAYMENT_METHODS).map(
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

                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Referencia</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ingrese la referencia"
                          {...field}
                          disabled={!selectedAssociate || isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
    </>
  );
}
