import PageContainer from '@/components/layout/page-container';
import { BankAccountHeader } from '@/feactures/banks/bank-account/components/bank-account-header';
import BankAccountList from '@/feactures/banks/bank-account/components/bank-account-list';
import BankAccountTableAction from '@/feactures/banks/bank-account/components/bank-account-tables/bank-account-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/banks/bank-account/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Cuentas Bancarias',
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
  const status = searchParamsCache.get('status');
  const currencyCode = searchParamsCache.get('currencyCode');
  const accountType = searchParamsCache.get('accountType');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <BankAccountHeader />
        <BankAccountTableAction />
        <BankAccountList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialAccountType={accountType}
          initialCurrencyCode={currencyCode}
        />
      </div>
    </PageContainer>
  );
}
