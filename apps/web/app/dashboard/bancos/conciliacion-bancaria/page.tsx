import PageContainer from '@/components/layout/page-container';

import {
  searchParamsCache,
  serialize,
} from '@/feactures/banks/bank-reconciliations/utils/searchparams';
import { BankReconciliationHeader } from '@/feactures/banks/bank-reconciliations/components/bank-reconciliation-header';
import BanksReconciliationList from '@/feactures/banks/bank-reconciliations/components/banks-reconciliation-list';
import BanksReconciliationTableAction from '@/feactures/banks/bank-reconciliations/components/banks-reconciliation/banks-reconciliation-table-action';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Conciliaciones Bancarias',
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
        <BankReconciliationHeader />
        <BanksReconciliationTableAction />
        <BanksReconciliationList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
