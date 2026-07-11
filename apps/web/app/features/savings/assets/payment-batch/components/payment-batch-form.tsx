import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/shadcn/form';
import { Form } from '@repo/shadcn/form';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Textarea } from '@repo/shadcn/textarea';
import { Skeleton } from '@repo/shadcn/skeleton';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToastSystem } from '@/hooks/use-toast-system';
import { useBankAccountAllQuery } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import {
  useApprovedLoans,
  useApprovedWithdrawals,
  useApprovedLiquidations,
} from '../hooks/use-payment-batch-query';
import { useCreatePaymentBatchMutation } from '../hooks/use-payment-batch-mutation';
import {
  createPaymentBatchSchema,
  type CreatePaymentBatch,
} from '../schemas/payment-batch-schema';
import { DisbursementTabs } from './disbursement-tabs';
import { type PaymentBatchApprovedItem } from './payment-batch-columns';
import { SelectionSummary } from './selection-summary';

interface PaymentBatchFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function PaymentBatchForm({ onCancel, onSuccess }: PaymentBatchFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToastSystem();

  const form = useForm<CreatePaymentBatch>({
    resolver: zodResolver(createPaymentBatchSchema),
    defaultValues: {
      currencyCode: 'VES',
      items: [],
    },
  });

  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } =
    useBankAccountAllQuery();
  const bankAccounts = bankAccountsData?.data || [];

  const {
    data: loansData,
    isLoading: isLoadingLoans,
  } = useApprovedLoans();

  const {
    data: withdrawalsData,
    isLoading: isLoadingWithdrawals,
    fetchNextPage: fetchNextWithdrawals,
    hasNextPage: hasNextWithdrawals,
    isFetchingNextPage: isFetchingNextWithdrawals,
  } = useApprovedWithdrawals();

  const {
    data: liquidationsData,
    isLoading: isLoadingLiquidations,
    fetchNextPage: fetchNextLiquidations,
    hasNextPage: hasNextLiquidations,
    isFetchingNextPage: isFetchingNextLiquidations,
  } = useApprovedLiquidations();

  const { mutate: createPaymentBatch } = useCreatePaymentBatchMutation();

  const approvedLoans = useMemo<PaymentBatchApprovedItem[]>(
    () => (loansData as { data: PaymentBatchApprovedItem[] })?.data || [],
    [loansData],
  );

  const approvedWithdrawals = useMemo<PaymentBatchApprovedItem[]>(
    () => withdrawalsData?.pages?.flatMap((page: { data?: PaymentBatchApprovedItem[] }) => page?.data || []) || [],
    [withdrawalsData],
  );

  const approvedLiquidations = useMemo<PaymentBatchApprovedItem[]>(
    () => liquidationsData?.pages?.flatMap((page: { data?: PaymentBatchApprovedItem[] }) => page?.data || []) || [],
    [liquidationsData],
  );

  const [selectedItems, setSelectedItems] = useState<
    { type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION'; sourceId: string }[]
  >([]);

  useEffect(() => {
    form.setValue('items', selectedItems, { shouldValidate: selectedItems.length > 0 });
  }, [selectedItems, form]);

  const allApprovedItemsMap = useMemo(() => {
    const map = new Map<string, PaymentBatchApprovedItem>();
    approvedLoans.forEach((i) => map.set(`LOAN:${i.id}`, i));
    approvedWithdrawals.forEach((i) => map.set(`WITHDRAWAL:${i.id}`, i));
    approvedLiquidations.forEach((i) => map.set(`LIQUIDATION:${i.id}`, i));
    return map;
  }, [approvedLoans, approvedWithdrawals, approvedLiquidations]);

  const totalSelectedAmount = useMemo(() => {
    let total = 0;
    selectedItems.forEach((selected) => {
      const key = `${selected.type}:${selected.sourceId}`;
      const item = allApprovedItemsMap.get(key);
      if (item) {
        total += parseFloat(item.amount || '0');
      }
    });
    return total;
  }, [selectedItems, allApprovedItemsMap]);

  const handleSubmit = form.handleSubmit((data) => {
    if (data.items.length === 0) {
      toast.error('Debe seleccionar al menos un registro');
      return;
    }
    if (!data.bankAccountId) {
      toast.error('Debe seleccionar una cuenta bancaria');
      return;
    }
    setIsSubmitting(true);
    createPaymentBatch(data, {
      onSuccess: () => {
        toast.success('Lote creado exitosamente');
        onSuccess();
      },
      onError: (error) => {
        toast.error((error as Error).message || 'Error al crear el lote');
      },
      onSettled: () => {
        setIsSubmitting(false);
      },
    });
  });

  const isLoading = isLoadingLoans || isLoadingWithdrawals || isLoadingLiquidations;

  const loansTotalCount = (loansData as { data: PaymentBatchApprovedItem[] })?.data?.length;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="bankAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Bancaria Origen</FormLabel>
                <SelectSearchable
                  options={bankAccounts.map((acc: { id: string; accountName: string | null; accountNumber: string }) => ({
                    value: acc.id,
                    label: `${acc.accountName} - ${acc.accountNumber}`,
                  }))}
                  onValueChange={(value) => field.onChange(value)}
                  placeholder="Seleccione cuenta bancaria"
                  defaultValue={field.value || ''}
                  disabled={isSubmitting || isLoadingBankAccounts}
                />
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
                    placeholder="Descripción del lote (opcional)"
                    {...field}
                    disabled={isSubmitting}
                    rows={2}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <DisbursementTabs
            approvedLoans={approvedLoans}
            approvedWithdrawals={approvedWithdrawals}
            approvedLiquidations={approvedLiquidations}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            isLoadingLoans={isLoadingLoans}
            isLoadingWithdrawals={isLoadingWithdrawals}
            isLoadingLiquidations={isLoadingLiquidations}
            loansPagination={{ totalCount: loansTotalCount }}
            withdrawalsPagination={{
              fetchNextPage: fetchNextWithdrawals,
              hasNextPage: hasNextWithdrawals,
              isFetchingNextPage: isFetchingNextWithdrawals,
              totalCount: withdrawalsData?.pages?.[0]?.meta?.totalItems,
            }}
            liquidationsPagination={{
              fetchNextPage: fetchNextLiquidations,
              hasNextPage: hasNextLiquidations,
              isFetchingNextPage: isFetchingNextLiquidations,
              totalCount: liquidationsData?.pages?.[0]?.meta?.totalItems,
            }}
          />
        )}

        <SelectionSummary
          selectedCount={selectedItems.length}
          totalAmount={totalSelectedAmount}
          currencyCode={form.getValues('currencyCode')}
          isSubmitting={isSubmitting}
          onProcess={handleSubmit}
        />
      </form>
    </Form>
  );
}
