import PageContainer from '@/components/layout/page-container';
import { LoansPaidHeader } from '@/feactures/savings-banks/loans/loans-paid/components/loans-paid-header';
import LoansPaidList from '@/feactures/savings-banks/loans/loans-paid/components/loans-paid-list';
import LoansPaidTableAction from '@/feactures/savings-banks/loans/loans-paid/components/loans-paid-tables/loans-paid-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/loans/loans-paid/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gestion de Pagos Prestamos',
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
  const bank = searchParamsCache.get('bank');
  const type = searchParamsCache.get('type');
  const method = searchParamsCache.get('method');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <LoansPaidHeader />
        <LoansPaidTableAction />
        <LoansPaidList
          initialBank={bank}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialType={type}
          inititalMethod={method}
        />
      </div>
    </PageContainer>
  );
}
