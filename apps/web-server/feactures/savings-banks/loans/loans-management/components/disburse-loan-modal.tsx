'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
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
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useBankAccountAll } from '../../../../banks/bank-account/hooks/use-query-bank-account';
import { useDisburseIndividualLoan } from '../hooks/use-loans-management-mutation';
import {
  DisburseIndividualLoan,
  disburseIndividualLoanSchema,
} from '../schemas/disburse-loan.schema';
import { PAYMENT_METHOD } from '../schemas/loans-management-options';
import { LoanManagement } from '../schemas/loans-management.schema';

interface DisburseLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanManagement | null;
}

export function DisburseLoanModal({
  isOpen,
  onClose,
  loan,
}: DisburseLoanModalProps) {
  const { data: bankAccountsResponse } = useBankAccountAll();
  const bankAccounts = bankAccountsResponse?.data || [];

  const { mutate: disburseLoan, isPending } = useDisburseIndividualLoan();

  const form = useForm<DisburseIndividualLoan>({
    resolver: zodResolver(disburseIndividualLoanSchema),
    defaultValues: {
      loanId: 0,
      bankAccountId: '',
      currencyCode: 'VES',
      paymentMethod: '',
      disbursementDate: new Date(),
      bankReference: '',
      description: '',
    },
  });

  useEffect(() => {
    if (loan && isOpen) {
      form.reset({
        loanId: Number(loan.id),
        bankAccountId: '',
        currencyCode: 'VES',
        paymentMethod: loan.paymentMethod ?? '',
        disbursementDate: new Date(),
        bankReference: '',
        description: `DESEMBOLSO PRÉSTAMO - ${loan.associateFullname}`,
      });
    }
  }, [loan, isOpen, form]);

  const onSubmit = (data: DisburseIndividualLoan) => {
    disburseLoan(
      {
        ...data,
        bankAccountId: Number(data.bankAccountId),
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Desembolsar Préstamo</DialogTitle>
          <DialogDescription>
            {loan.customReference} - {loan.associateFullname}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta Bancaria Origen</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map((account: any) => (
                        <SelectItem key={account.id} value={String(account.id)}>
                          {account.bankName} - {account.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VES">VES (Bolívares)</SelectItem>
                        <SelectItem value="USD">USD (Dólares)</SelectItem>
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
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione método" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD).map(([value, label]) => (
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="disbursementDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Desembolso</FormLabel>
                    <FormControl>
                      <CustomCalendar
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Seleccione la fecha"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia Bancaria</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. 12345678"
                        {...field}
                        disabled={isPending}
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
                  <FormLabel>Descripción / Concepto</FormLabel>
                  <FormControl>
                     <Textarea
                      placeholder="Concepto del desembolso..."
                      className="resize-none"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Desembolsando...' : 'Confirmar Desembolso'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
