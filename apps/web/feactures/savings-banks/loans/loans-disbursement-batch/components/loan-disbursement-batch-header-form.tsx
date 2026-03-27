'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { Textarea } from '@repo/shadcn/textarea';
import { UseFormReturn } from 'react-hook-form';
import { CreateLoanDisbursementBatch } from '../schemas/loan-disbursement/batch.schema';

interface LoanDisbursementBatchHeaderProps {
  formMethods: UseFormReturn<CreateLoanDisbursementBatch>;
  bankAccounts: any[];
  isLoadingBankAccounts: boolean;
  isSubmitting: boolean;
}

export function LoanDisbursementBatchHeaderForm({
  formMethods,
  bankAccounts,
  isLoadingBankAccounts,
  isSubmitting,
}: LoanDisbursementBatchHeaderProps) {
  if (!formMethods) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={formMethods.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta Bancaria Origen</FormLabel>
              <SelectSearchable
                options={bankAccounts.map((acc) => ({
                  value: String(acc.id),
                  label: `${acc.accountName} (${acc.accountNumber})`,
                }))}
                onValueChange={(value) => field.onChange(Number(value))}
                placeholder="Seleccione una cuenta bancaria"
                defaultValue={String(field.value) || ''}
                disabled={isSubmitting || isLoadingBankAccounts}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={formMethods.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descripción del lote de pago (opcional)"
                {...field}
                disabled={isSubmitting}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
