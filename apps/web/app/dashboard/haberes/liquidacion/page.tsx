import PageContainer from '@/components/layout/page-container';
import { SettlementHeader } from '@/feactures/savings-banks/assets/settlement/components/settlement-header';
import SettlementList from '@/feactures/savings-banks/assets/settlement/components/settlement-list';
import SettlementTableAction from '@/feactures/savings-banks/assets/settlement/components/settlement-tables/settlement-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/assets/settlement/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gestion de Liquidación Haberes',
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
      <div className="flex flex-1 flex-col space-y-6">
        <SettlementHeader />
        <SettlementTableAction />
        <SettlementList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
