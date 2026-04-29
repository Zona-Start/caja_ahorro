import PageContainer from '@/components/layout/page-container';
import { TypeLoansHeader } from '@/feactures/savings-banks/loans/type-loans/components/type-loans-header';
import TypeLoansList from '@/feactures/savings-banks/loans/type-loans/components/type-loans-list';
import TypeLoansTableAction from '@/feactures/savings-banks/loans/type-loans/components/type-loans-tables/type-loans-action';
import { searchParamsCache } from '@/feactures/savings-banks/loans/type-loans/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipo Prestamos',
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
        <TypeLoansHeader />
        <TypeLoansTableAction />
        <TypeLoansList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
