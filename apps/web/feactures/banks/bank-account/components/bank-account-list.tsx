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

  const { setTotalBalanceBs, setTotalBalanceUsd } = useBankAccountStore();

  useEffect(() => {
    if (data?.data) {
      // Calcular totales por moneda
      const totalsByVES = data.data
        .filter((account) => account.isActive && account.currencyCode === 'VES')
        .reduce(
          (sum, account) =>
            sum + Number.parseFloat(account?.currentBalance ?? '0'),
          0,
        );

      const totalsByUSD = data.data
        .filter((account) => account.isActive && account.currencyCode === 'USD')
        .reduce(
          (sum, account) =>
            sum + Number.parseFloat(account.currentBalance ?? '0'),
          0,
        );

      setTotalBalanceBs(Number(totalsByVES));
      setTotalBalanceUsd(Number(totalsByUSD));
    }
  }, [data, setTotalBalanceBs, setTotalBalanceUsd]);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={initialLimit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={(data?.data || []).map((item) => ({
        ...item,
        accountName: item.accountName ?? undefined,
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
