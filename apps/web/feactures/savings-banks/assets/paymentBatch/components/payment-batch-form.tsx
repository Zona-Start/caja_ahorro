'use client';
import { IconWrapper } from '@/components/icon-wrapper';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Skeleton } from '@repo/shadcn/components/ui/skeleton';
import { Form } from '@repo/shadcn/form';
import { Banknote } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBankAccountAll } from '../../../../banks/bank-account/hooks/use-query-bank-account';
import {
  useApprovedLiquidations,
  useApprovedLoans,
  useApprovedWithdrawals,
} from '../hooks/use-query-source-items';
import {
  CreatePaymentBatch,
  createPaymentBatchSchema,
} from '../schemas/payment-batch.schema';
import { DisbursementTabs } from './disbursement-tabs';
import {  PaymentBatchHeaderForm } from './payment-batch-header-form';
import { SelectedItem } from './payment-batch-types';
import { SelectionSummary } from './selection-summary';

interface PaymentBatchFormProps {
  isSubmitting: boolean;
  onSubmit: (data: CreatePaymentBatch) => void;
  onCancel: () => void;
  initialData?: any; // TODO: Define a proper type for initialData
  isEdit?: boolean;
}

const DetailsSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
};

export function PaymentBatchForm({
  isSubmitting,
  onSubmit,
  onCancel,
  initialData,
  isEdit,
}: PaymentBatchFormProps) {
  const form = useForm<CreatePaymentBatch>({
    resolver: zodResolver(createPaymentBatchSchema),
    defaultValues: initialData || {
      bankAccountId: undefined,
      currencyCode: 'VES', // Default currency, will be updated based on bank account
      description: '',
      status: 'DRAFT', // Default status
      items: [],
    },
  });

  const { data: bankAccountsData, isLoading: isLoadingBankAccounts } =
    useBankAccountAll();
  const bankAccounts = bankAccountsData?.data || [];
  
  // Fetch approved items
  const { data: approvedLoans, isLoading: isLoadingLoans } = useApprovedLoans();
  const { data: approvedWithdrawals, isLoading: isLoadingWithdrawals } =
    useApprovedWithdrawals();
  const { data: approvedLiquidations, isLoading: isLoadingLiquidations } =
    useApprovedLiquidations();

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>(
    initialData?.items || [],
  );

  // Keep form items in sync with selectedItems state
  useEffect(() => {
    form.setValue('items', selectedItems);
  }, [selectedItems, form]);

  const handleSelectionChange = (newSelectedItems: SelectedItem[]) => {
    setSelectedItems(newSelectedItems);
  };

  const totalSelectedAmount = useMemo(() => {
    let total = 0;
    selectedItems.forEach((selected) => {
      let item;
      if (selected.type === 'LOAN') {
        item = approvedLoans?.find((loan) => loan.id === selected.sourceId);
      } else if (selected.type === 'WITHDRAWAL') {
        item = approvedWithdrawals?.find(
          (withdrawal) => withdrawal.id === selected.sourceId,
        );
      } else if (selected.type === 'LIQUIDATION') {
        item = approvedLiquidations?.find(
          (liquidation) => liquidation.id === selected.sourceId,
        );
      }
      if (item) {
        total += Number(item.amount);
      }
    });
    return total;
  }, [selectedItems, approvedLoans, approvedWithdrawals, approvedLiquidations]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  if (isLoadingLoans || isLoadingWithdrawals || isLoadingLiquidations) {
    return <DetailsSkeleton />;
  }

  return (
    <>
      <Card className="mb-24">
        {' '}
        {/* Margin bottom to account for sticky footer */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconWrapper className="w-8 h-8">
              <Banknote />
            </IconWrapper>
            Datos del Lote de Pago
          </CardTitle>
          <CardDescription>
            Ingrese la información para crear un nuevo lote de pago.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <PaymentBatchHeaderForm
                formMethods={form}
                bankAccounts={bankAccounts}
                isLoadingBankAccounts={isLoadingBankAccounts}
                isSubmitting={isSubmitting}
              />

              <DisbursementTabs
                approvedLoans={approvedLoans || []}
                approvedWithdrawals={approvedWithdrawals || []}
                approvedLiquidations={approvedLiquidations || []}
                selectedItems={selectedItems}
                onSelectionChange={handleSelectionChange}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <SelectionSummary
        selectedCount={selectedItems.length}
        totalAmount={totalSelectedAmount}
        currencyCode={form.getValues('currencyCode')}
        isSubmitting={isSubmitting}
        onProcess={handleSubmit}
        isEdit={isEdit}
      />
    </>
  );
}
