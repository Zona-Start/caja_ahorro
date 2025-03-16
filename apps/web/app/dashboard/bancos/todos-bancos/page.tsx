import PageContainer from '@/components/layout/page-container';
import { BanksHeader } from '@/feactures/banks/bank/components/account-plan-header';
import BanksList from '@/feactures/banks/bank/components/banks-list';
import BanksTableAction from '@/feactures/banks/bank/components/banks-tables/banks-table-action';

import {
  searchParamsCache,
  serialize,
} from '@/feactures/banks/bank/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Bancos',
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
        <BanksHeader />
        <BanksTableAction />
        <BanksList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
