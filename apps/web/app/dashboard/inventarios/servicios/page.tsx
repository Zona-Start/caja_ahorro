import PageContainer from '@/components/layout/page-container';
import ServiceHeader from '@/feactures/administration/inventories/services/components/service-header';
import ServiceList from '@/feactures/administration/inventories/services/components/service-list';
import ServiceTableActions from '@/feactures/administration/inventories/services/components/service-tables/table-actions';
import { searchParamsCache } from '@/feactures/administration/inventories/services/utils';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Productos',
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
  const suppliersId = searchParamsCache.get('suppliersId');
  const status = searchParamsCache.get('status');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <ServiceHeader />
        <ServiceTableActions />
        <ServiceList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialStatus={status}
          initialSuppliersId={suppliersId}
        />
      </div>
    </PageContainer>
  );
}
