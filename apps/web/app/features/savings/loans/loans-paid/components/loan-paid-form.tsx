'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertModal } from '@/components/shared/alert-modal';
import { IconWrapper } from '@/components/icon-wrapper';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
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
import { Banknote } from 'lucide-react';
import { type AssociatesLoan } from '../schemas/individual-load-api-schema';
import {
  LOAN_PAYMENT_TYPES,
  PAYMENT_METHOD,
} from '../schemas/loans-paid-options';
import {
  loanPaymentSchema,
  type LoanPayment,
} from '../schemas/loans-paid.schema';

interface LoanPaidFormProps {
  selectedAssociate: AssociatesLoan | null;
  isSubmitting: boolean;
  onSubmit: (data: LoanPayment) => void;
  onCancel: () => void;
  currentCurrencyCode?: string;
  initialData?: Partial<LoanPayment>;
  isEdit?: boolean;
}

export function LoanPaidForm({
  selectedAssociate,
  isSubmitting,
  onSubmit,
  onCancel,
  currentCurrencyCode = 'VES',
  initialData,
  isEdit = false,
}: LoanPaidFormProps) {
  const form = useForm<LoanPayment>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: initialData || {
      creditId: 0,
      paymentDate: new Date(),
      paymentType: 'REGULAR',
      amount: '',
      bankId: 0,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: '',
      comment: '',
    },
  });

  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [dataToSubmit, setDataToSubmit] = useState<LoanPayment | null>(null);

  const { data: bankAccountsResponse } = useBankAccountAll();
  const bankAccounts = bankAccountsResponse?.data || [];

  useEffect(() => {
    if (selectedAssociate) {
      form.setValue('creditId', selectedAssociate.loanSummary.loanId);
    }
  }, [selectedAssociate, form]);

  const handleSubmit = form.handleSubmit((data) => {
    setDataToSubmit(data);
    setConfirmOpen(true);
  });

  const onConfirm = () => {
    if (dataToSubmit) {
      onSubmit(dataToSubmit);
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <AlertModal
        isOpen={isConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={onConfirm}
        loading={isSubmitting}
        title="Confirmar Registro de Pago"
        description="¿Está seguro que desea registrar este pago de préstamo?"
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-8 h-8">
              <Banknote />
            </IconWrapper>
            Datos del Pago
          </CardTitle>
          <CardDescription>
            {isEdit
              ? 'Actualice la información del pago'
              : 'Ingrese la información del pago de préstamo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Pago</FormLabel>
                      <FormControl>
                        <CustomCalendar
                          value={field.value}
                          onChange={field.onChange}
                          disabled={isSubmitting}
                          placeholder="Seleccione la fecha"
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
                        disabled={isSubmitting || !selectedAssociate}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(LOAN_PAYMENT_TYPES).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cuenta Bancaria</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        defaultValue={field.value ? String(field.value) : ''}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione la cuenta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bankAccounts.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={String(account.id)}
                            >
                              {account.bankName} - {account.accountNumber}
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
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pago</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting || !selectedAssociate}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PAYMENT_METHOD).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Monto{' '}
                        {currentCurrencyCode === 'VES' ? '(Bs.)' : '($)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          disabled={isSubmitting || !selectedAssociate}
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
                          placeholder="Número de referencia"
                          {...field}
                          value={field.value ?? ''}
                          disabled={isSubmitting}
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
                        placeholder="Comentario sobre el pago..."
                        className="resize-none"
                        {...field}
                        value={field.value ?? ''}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedAssociate}
                >
                  {isEdit ? 'Actualizar Pago' : 'Registrar Pago'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
