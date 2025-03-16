import PageContainer from '@/components/layout/page-container';
import { AccountPlanHeader } from '@/feactures/accounting/accounting-accounts/components/account-plan-header';
import AccountingAccountsList from '@/feactures/accounting/accounting-accounts/components/accounting-accounts-list';
import AccountsTableAction from '@/feactures/accounting/accounting-accounts/components/accounts-tables/accounts-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/accounting/accounting-accounts/utils/searchparams';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Cuentas Contables',
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  const key = serialize({ ...searchParams });

  const page = Number(searchParamsCache.get('page')) || 1;
  const search = searchParamsCache.get('q');
  const pageLimit = Number(searchParamsCache.get('limit')) || 10;
  const type = searchParamsCache.get('type');
  const level = searchParamsCache.get('level');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountPlanHeader />
        <AccountsTableAction />
        <AccountingAccountsList
          initialLevel={level}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialType={type}
        />
      </div>
    </PageContainer>
  );
}
