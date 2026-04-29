import PageContainer from '@/components/layout/page-container';
import { CreditsPaidHeader } from '@/feactures/savings-banks/credits/credits-paid/components/credits-paid-header';
import CreditsPaidList from '@/feactures/savings-banks/credits/credits-paid/components/credits-paid-list';
import CreditsPaidTableAction from '@/feactures/savings-banks/credits/credits-paid/components/credits-paid-tables/credits-paid-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/credits/credits-paid/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gestion de Pagos Créditos',
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
        <CreditsPaidHeader />
        <CreditsPaidTableAction />
        <CreditsPaidList
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
