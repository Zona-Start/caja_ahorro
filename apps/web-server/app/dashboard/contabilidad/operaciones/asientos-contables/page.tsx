import PageContainer from '@/components/layout/page-container';
import { AccountingEntryHeader } from '@/feactures/accounting/accounting-entries/components/accounting-entry-header';
import AccountingEntryList from '@/feactures/accounting/accounting-entries/components/accounting-entry-list';
import AccountingEntryTableAction from '@/feactures/accounting/accounting-entries/components/tables/accounting-entry-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/accounting/accounting-entries/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Asientos Contables',
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
  const accountingCycleId = searchParamsCache.get('accountingCycleId');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingEntryHeader />
        <AccountingEntryTableAction />
        <AccountingEntryList
          initialPage={page}
          initialLimit={pageLimit}
          initialSearch={search}
          initialStatus={status}
          initialCycleId={accountingCycleId}
        />
      </div>
    </PageContainer>
  );
}
