import PageContainer from '@/components/layout/page-container';
import { PurchaseOrderHeader } from '@/feactures/accounts-payable/purchase-orders/components/purchase-order-header';
import PurchaseOrderTableAction from '@/feactures/accounts-payable/purchase-orders/components/purchase-order-tables/purchase-orders-table-action';
import PurchaseOrderList from '@/feactures/accounts-payable/purchase-orders/components/purchase-orders-list';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/accounts-payable/purchase-orders/utils/searchparams';

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
        />
      </div>
    </PageContainer>
  );
}
