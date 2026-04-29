import PageContainer from '@/components/layout/page-container';
import { PurchaseOrderHeader } from '@/feactures/administration/purchase-orders/components';
import PurchaseOrderList from '@/feactures/administration/purchase-orders/components/purchase-order-list';
import PurchaseOrderTableAction from '@/feactures/administration/purchase-orders/components/purchase-order-tables/purchase-orders-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/administration/purchase-orders/utils';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Compras',
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
  const supplierId = searchParamsCache.get('supplierId');
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <PurchaseOrderHeader />
        <PurchaseOrderTableAction />
        <PurchaseOrderList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialSupplierId={supplierId}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />
      </div>
    </PageContainer>
  );
}
