import PageContainer from '@/components/layout/page-container';
import {
  searchParamsCache,

} from '@/feactures/accounting/accounting-accounts/utils/searchparams';
import TransactionTypeTableAction from '@/feactures/configurations/transaction-type/components/transaction-tables/transaction-type-action';
import { TransactionTypeHeader } from '@/feactures/configurations/transaction-type/components/transaction-type-header';
import TransactionTypeList from '@/feactures/configurations/transaction-type/components/transaction-type-list';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipo transacciones',
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const page = Number(searchParamsCache.get('page')) || 1;
  const search = searchParamsCache.get('q');
  const pageLimit = Number(searchParamsCache.get('limit')) || 10;


  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <TransactionTypeHeader />
        <TransactionTypeTableAction />
        <TransactionTypeList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
