import PageContainer from '@/components/layout/page-container';
import { BankMovementHeader } from '@/feactures/banks/bank-movements/components/bank-movement-header';
import BankMovementList from '@/feactures/banks/bank-movements/components/bank-movement-list';
import BankMovementTableAction from '@/feactures/banks/bank-movements/components/tables/bank-movement-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/banks/bank-movements/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Movimientos Bancarios',
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
  const bankAccountId = searchParamsCache.get('bankAccountId');
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <BankMovementHeader />
        <BankMovementTableAction />
        <BankMovementList
          initialPage={page}
          initialLimit={pageLimit}
          initialBankAccountId={bankAccountId}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />
      </div>
    </PageContainer>
  );
}
