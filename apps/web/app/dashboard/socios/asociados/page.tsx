import PageContainer from '@/components/layout/page-container';
import { AssociatesHeader } from '@/feactures/savings-banks/partners/associates/components/associates-header';
import AssociatesList from '@/feactures/savings-banks/partners/associates/components/associates-list';
import AssociatesTableAction from '@/feactures/savings-banks/partners/associates/components/associates-tables/associates-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/partners/associates/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Asociados',
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
  const payroll = searchParamsCache.get('payroll');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AssociatesHeader />
        <AssociatesTableAction />
        <AssociatesList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialPayroll={payroll}
        />
      </div>
    </PageContainer>
  );
}
