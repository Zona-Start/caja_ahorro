import PageContainer from '@/components/layout/page-container';
import { WithdrawalHeader } from '@/feactures/savings-banks/assets/withdrawal/components/withdrawal-header';
import WithdrawalList from '@/feactures/savings-banks/assets/withdrawal/components/withdrawal-list';
import WithdrawalTableAction from '@/feactures/savings-banks/assets/withdrawal/components/withdrawal-tables/withdrawal-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/assets/withdrawal/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gestion de Retiros Haberes',
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
  const type = searchParamsCache.get('type');
  const status = searchParamsCache.get('status');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <WithdrawalHeader />
        <WithdrawalTableAction />
        <WithdrawalList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialType={type}
          initialStatus={status}
        />
      </div>
    </PageContainer>
  );
}
