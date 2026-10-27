'use client';

import { IconWrapper } from '@/components/icon-wrapper';
import { AlertModal } from '@/components/shared/alert-modal';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
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
import { CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import { CREDIT_PAYMENT_TYPES, PAYMENT_METHOD } from '../schemas/credits-paid-options';
import {
  creditPaymentFormSchema,
  type CreditPaymentFormValues,
} from '../schemas/credits-paid.schema';
import type { AssociatesCredit } from '../schemas/individual-credits-api-schema';

interface CreditPaidFormProps {
  selectedAssociate: AssociatesCredit | null;
  isSubmitting: boolean;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function CreditPaidForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
}: CreditPaidFormProps) {
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [dataToSubmit, setDataToSubmit] = useState<Record<string, unknown> | null>(null);
  const [rate, setRate] = useState(0);

  const creditCurrency = selectedAssociate?.creditCurrencyCode || 'VES';
  const isForeign = creditCurrency !== 'VES';
  const currencyLabel = isForeign ? creditCurrency : 'Bs';

  useEffect(() => {
    if (!isForeign) {
      setRate(1);
      return;
    }
    let cancelled = false;
    apiClient
      .get(`/core/exchange-rates/latest/${creditCurrency}`)
      .then((res) => {
        if (cancelled) return;
        const value = Number(res.data?.rate);
        if (Number.isFinite(value) && value > 0) setRate(value);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isForeign, creditCurrency]);

  const form = useForm<CreditPaymentFormValues>({
    resolver: zodResolver(creditPaymentFormSchema),
    defaultValues: {
      creditId: selectedAssociate?.creditId ?? '',
      paymentDate: new Date(),
      paymentType: 'PAYING',
      amount: '',
      bankId: undefined,
      paymentMethod: 'CASH',
      transactionReference: '',
      comment: '',
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    const payload = {
      ...data,
      amount: Number(data.amount),
      bankId: data.bankId || undefined,
      currencyCode: creditCurrency,
      exchangeRate: isForeign ? rate : 1,
    };
    setDataToSubmit(payload);
    setConfirmOpen(true);
  });

  const onConfirm = () => {
    if (dataToSubmit) {
      onSubmit(dataToSubmit);
      setConfirmOpen(false);
    }
  };

  const paymentTypeOptions = Object.entries(CREDIT_PAYMENT_TYPES).map(
    ([value, label]) => ({ value, label }),
  );

  const paymentMethodOptions = Object.entries(PAYMENT_METHOD).map(
    ([value, label]) => ({ value, label }),
  );

  const totalPending = selectedAssociate?.creditTotalAmount
    ? Number(selectedAssociate.creditTotalAmount).toFixed(2)
    : '0.00';

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        loading={isSubmitting}
        title="Confirmar Pago"
        description={`¿Está seguro que desea registrar este pago? Esta operación afectará el saldo del crédito del asociado ${selectedAssociate?.fullname || ''}.`}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-8 h-8">
              <CreditCard />
            </IconWrapper>
            Datos del Pago
          </CardTitle>
          <CardDescription>
            Saldo pendiente total:{' '}
            <span className="font-bold text-orange-600">
              {totalPending} {currencyLabel}
            </span>
            {isForeign && rate > 0 && (
              <span className="ml-1 text-xs text-muted-foreground">
                (≈ {(Number(totalPending) * rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Pago</FormLabel>
                      <FormControl>
                        <CustomCalendar
                          value={field.value}
                          onChange={field.onChange}
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
                      <FormLabel>Tipo de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                      <FormLabel>Monto ({currencyLabel})</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="0.00"
                        />
                      </FormControl>
                      {isForeign && rate > 0 && Number(field.value) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {(Number(field.value) * rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                        </p>
                      )}
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
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="bankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco (ID)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="UUID del banco (opcional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transactionReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia de Transacción</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Número de referencia"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentario</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Comentarios adicionales sobre el pago"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
