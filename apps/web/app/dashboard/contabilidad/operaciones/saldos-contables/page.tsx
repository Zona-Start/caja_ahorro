import PageContainer from '@/components/layout/page-container';
import { AccountingBalanceHeader } from '@/feactures/accounting/accounting-balances/components/accounting-balance-header';
import AccountingBalancesList from '@/feactures/accounting/accounting-balances/components/accounting-balances-list';
import { AccountingBalanceTableAction } from '@/feactures/accounting/accounting-balances/components/tables/accounting-balance-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/accounting/accounting-entries/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Balances Contables',
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

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingBalanceHeader />
        <AccountingBalanceTableAction />
        <AccountingBalancesList
          initialPage={page}
          initialLimit={pageLimit}
          initialSearch={search}
        />
      </div>
    </PageContainer>
  );
}
