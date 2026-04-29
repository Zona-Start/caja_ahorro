import PageContainer from '@/components/layout/page-container';
import { TypeCreditsHeader } from '@/feactures/savings-banks/credits/type-credits/components/type-credits-header';
import TypeCreditsList from '@/feactures/savings-banks/credits/type-credits/components/type-credits-list';
import TypeCreditsTableAction from '@/feactures/savings-banks/credits/type-credits/components/type-credits-tables/type-credits-action';
import { searchParamsCache } from '@/feactures/savings-banks/loans/type-loans/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipo Créditos',
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
        <TypeCreditsHeader />
        <TypeCreditsTableAction />
        <TypeCreditsList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
