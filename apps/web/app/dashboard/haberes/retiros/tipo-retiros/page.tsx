import PageContainer from '@/components/layout/page-container';
import { WithdrawalTypesHeader } from '@/feactures/savings-banks/assets/withdrawal-types/components/withdrawal-types-header';
import WithdrawalTypesList from '@/feactures/savings-banks/assets/withdrawal-types/components/withdrawal-types-list';
import WithdrawalTypesTableAction from '@/feactures/savings-banks/assets/withdrawal-types/components/withdrawal-types-tables/withdrawal-types-action';
import { searchParamsCache } from '@/feactures/savings-banks/assets/withdrawal-types/utils/searchparams';
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
        <WithdrawalTypesHeader />
        <WithdrawalTypesTableAction />
        <WithdrawalTypesList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
