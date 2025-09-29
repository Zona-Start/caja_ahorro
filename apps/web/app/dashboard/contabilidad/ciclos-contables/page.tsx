import PageContainer from '@/components/layout/page-container';
import { AccountingCycleHeader } from '@/feactures/accounting/accounting-cycles/components/accounting-cycle-header';
import AccountingCycleList from '@/feactures/accounting/accounting-cycles/components/accounting-cycle-list';
import AccountingCycleTableAction from '@/feactures/accounting/accounting-cycles/components/tables/accounting-cycle-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/accounting/accounting-cycles/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Ciclos Contables',
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
  const status = searchParamsCache.get('status');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingCycleHeader />
        <AccountingCycleTableAction />
        <AccountingCycleList
          initialPage={page}
          initialLimit={pageLimit}
          initialSearch={search}
          initialStatus={status}
        />
      </div>
    </PageContainer>
  );
}
