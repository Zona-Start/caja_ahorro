'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { useBanksQuery } from '@/feactures/banks/bank-directory/hooks/use-banks-querys';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Banknote, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import {
  CREDIT_PAYMENT_TYPES,
  PAYMENT_METHOD,
} from '../schemas/credits-paid-options';
import { creditPaymentSchema } from '../schemas/credits-paid.schema';
import { useCreditPaidStore } from '../store/creditsPaidStore';

interface CreditFormProps {
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  currentCurrencyCode: string | undefined;
  currentExchangeRate: number | undefined;
  initialData?: any; // <-- NUEVO: recibir initialData como prop
  isEdit?: boolean; // <-- NUEVO: recibir isEdit como prop
}

export function CreditPaidForm({
  isSubmitting,
  onSubmit,
  onCancel,
  currentCurrencyCode,
  currentExchangeRate,
  initialData,
  isEdit, // <-- NUEVO: recibir isEdit como prop
}: CreditFormProps) {
  const { selectedAssociate, creditSummary } = useCreditPaidStore();

  const { data: Banks } = useBanksQuery();
  const [isCancellation, setIsCancellation] = useState(false);

  const form = useForm<z.infer<typeof creditPaymentSchema>>({
    resolver: zodResolver(creditPaymentSchema),
    defaultValues:
      isEdit && initialData
        ? {
            id: initialData?.id,
            amount: initialData?.amount,
            bankId: Number(initialData?.bankId),
            comment: initialData?.comment,
            creditId: initialData?.creditId,
            creditPaidId: initialData?.creditPaidId,
            paymentDate: initialData?.paymentDate,
            paymentMethod: initialData?.paymentMethod,
            paymentType: initialData?.paymentType,
            transactionReference: initialData?.transactionReference,
          }
        : {
            amount: '',
            bankId: 0,
            comment: '',
            creditId: 0,
            paymentDate: new Date(),
            paymentMethod: 'BANK_TRANSFER',
            paymentType: 'PAYING',
            transactionReference: '',
          },
  });

  // <-- Agrega este efecto para resetear el formulario cuando initialData cambie
  useEffect(() => {
    if (isEdit && initialData) {
      form.reset({
        id: initialData?.id,
        amount: initialData?.amount,
        bankId: Number(initialData?.bankId),
        comment: initialData?.comment,
        creditId: initialData?.creditId,
        creditPaidId: initialData?.creditPaidId,
        paymentDate: initialData.paymentDate
          ? new Date(initialData.paymentDate)
          : new Date(),
        paymentMethod: initialData?.paymentMethod,
        paymentType: initialData?.paymentType,
        transactionReference: initialData?.transactionReference,
      });
    }
  }, [isEdit, initialData]);

  //Actualizar el associateId cuando cambia el asociado seleccionado
  useEffect(() => {
    if (selectedAssociate) {
      form.setValue(
        'creditPaidId',
        selectedAssociate?.creditPaidId ?? undefined,
      );
      form.setValue('creditId', selectedAssociate.creditId ?? 0);
    } else {
      form.setValue('id', 0);
      // form.reset({
      //   amount: '',
      //   bankId: 0,
      //   comment: '',
      //   creditId: 0,
      //   paymentDate: new Date(),
      //   paymentMethod: 'BANK_TRANSFER',
      //   paymentType: 'PAYING',
      //   transactionReference: '',
      // });
    }
  }, [selectedAssociate, form]);

  const paymentType = useWatch({ control: form.control, name: 'paymentType' });
  const amount = useWatch({ control: form.control, name: 'amount' });

  useEffect(() => {
    if (!selectedAssociate) return;
    if (paymentType === 'CANCELLATION') {
      //const calculatedAmount = calculateAmount();
      const calculatedAmount = selectedAssociate.creditTotalAmount;

      // Evita ciclos si el valor ya es el correcto
      if (amount !== calculatedAmount) {
        form.setValue('amount', calculatedAmount, { shouldValidate: true });
      }

      setIsCancellation(true);
    } else if (paymentType === 'PAYING') {
      // Solo limpia si venimos de CANCELLATION
      if (isCancellation) {
        form.setValue('amount', '');
        setIsCancellation(false);
      }
    }
  }, [paymentType, selectedAssociate]);

  // Función para manejar el envío del formulario
  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconWrapper className="w-8 h-8">
            <Banknote />
          </IconWrapper>
          Datos del Pago
        </CardTitle>
        <CardDescription>
          Ingrese la información del pago a registrar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Fecha de Pago</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Seleccione la fecha"
                        disabled={!selectedAssociate || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Operación</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedAssociate || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {Object.entries(CREDIT_PAYMENT_TYPES).map(
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
                name="bankId"
                render={({ field }) => (
                  <FormItem className="w-full col-span-2">
                    <FormLabel>Banco</FormLabel>
                    <SelectSearchable
                      options={
                        Banks?.data?.map((item: any) => ({
                          value: item.id!.toString(),
                          label: `${item.code} - ${item.name}`,
                        })) || []
                      }
                      onValueChange={(value) => field.onChange(Number(value))}
                      placeholder="Selecciona un banco"
                      defaultValue={String(field.value)}
                      disabled={!selectedAssociate || isSubmitting}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del Pago</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                          {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}
                        </span>
                        <Input
                          className="pl-8"
                          placeholder="0.00"
                          {...field}
                          disabled={
                            !selectedAssociate ||
                            isSubmitting ||
                            paymentType === 'CANCELLATION'
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de Pago</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!selectedAssociate || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione el tipo" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD).map(
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
                name="transactionReference"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Número de Comprobante</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ingrese el número de referencia"
                        value={field.value ?? ''}
                        disabled={!selectedAssociate || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ingrese cualquier observación relevante sobre el préstamo"
                        className="resize-none"
                        {...field}
                        value={field.value ?? ''}
                        disabled={!selectedAssociate || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {creditSummary && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Resumen del Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cuota Mensual
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {creditSummary.totalQuota}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Interés Total
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {creditSummary.totalInterest}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Gastos Administrativos
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {creditSummary.installmentAmount}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total a Pagar
                      </p>
                      <p className="text-lg font-medium">
                        {currentCurrencyCode === 'VES' ? 'Bs ' : '$ '}{' '}
                        {creditSummary.totalPayable}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => handleCancel()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !selectedAssociate || isSubmitting || !form.formState.isValid
                }
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Procesando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {isEdit ? 'Actualizar Pago' : 'Crear Pago'}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
