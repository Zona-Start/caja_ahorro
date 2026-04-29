'use client';

import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useEffect } from 'react';
import { useBankAccount } from '../hooks/use-query-bank-account';
import { useBankAccountStore } from '../store/bank-account.store';
import { columns } from './bank-account-tables/columns';

interface AssociatesListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialCurrencyCode?: string | null;
  initialAccountType?: string | null;
}

export default function BankAccountList({
  initialPage,
  initialSearch,
  initialLimit,
  initialStatus,
  initialAccountType,
  initialCurrencyCode,
}: AssociatesListProps) {
  const filters = {
    page: initialPage,
    limit: initialLimit,
    ...(initialSearch && { search: initialSearch }),
    ...(initialStatus && { status: initialStatus }),
    ...(initialAccountType && { accountType: initialAccountType }),
    ...(initialCurrencyCode && { currencyCode: initialCurrencyCode }),
  };

  const { data, isLoading } = useBankAccount(filters);

  const {
    setTotalBookBalanceBs,
    setTotalStatementBalanceBs,
    setTotalBookBalanceUsd,
    setTotalStatementBalanceUsd,
  } = useBankAccountStore();

  useEffect(() => {
    if (data?.data) {
      const activeAccounts = data.data.filter((account) => account.isActive);

      const totalBookBs = activeAccounts
        .filter((acc) => acc.currencyCode === 'VES')
        .reduce((sum, acc) => sum + Number(acc.currentBalance ?? '0'), 0);

      const totalStatementBs = activeAccounts
        .filter((acc) => acc.currencyCode === 'VES')
        .reduce((sum, acc) => sum + Number(acc.lastStatementBalance ?? '0'), 0);

      const totalBookUsd = activeAccounts
        .filter((acc) => acc.currencyCode === 'USD')
        .reduce((sum, acc) => sum + Number(acc.currentBalance ?? '0'), 0);

      const totalStatementUsd = activeAccounts
        .filter((acc) => acc.currencyCode === 'USD')
        .reduce((sum, acc) => sum + Number(acc.lastStatementBalance ?? '0'), 0);

      setTotalBookBalanceBs(totalBookBs);
      setTotalStatementBalanceBs(totalStatementBs);
      setTotalBookBalanceUsd(totalBookUsd);
      setTotalStatementBalanceUsd(totalStatementUsd);
    }
  }, [
    data,
    setTotalBookBalanceBs,
    setTotalStatementBalanceBs,
    setTotalBookBalanceUsd,
    setTotalStatementBalanceUsd,
  ]);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={(data?.data || []).map((item) => ({
        ...item,
        accountName: item.accountName ? item.accountName : 'No Disponible',
        currencyCode: item.currencyCode as 'VES' | 'USD',
        lastStatementDate: item.lastStatementDate
          ? new Date(item.lastStatementDate)
          : undefined,
        openingDate: item.openingDate ? new Date(item.openingDate) : undefined,
        currentBalance: item.currentBalance
          ? parseFloat(item.currentBalance)
          : undefined,
        lastStatementBalance: item.lastStatementBalance
          ? parseFloat(item.lastStatementBalance)
          : undefined,
      }))}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
