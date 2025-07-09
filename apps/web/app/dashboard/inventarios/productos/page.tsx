import PageContainer from '@/components/layout/page-container';
import SalesProductHeader from '@/feactures/inventories/sales/sales-product/components/sales-product-header';
import SalesProductList from '@/feactures/inventories/sales/sales-product/components/sales-product-list';
import SalesProductTableActions from '@/feactures/inventories/sales/sales-product/components/sales-product-tables/table-actions';
import { searchParamsCache } from '@/feactures/inventories/sales/sales-product/utils/searchparams';

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
  const typeCategory = searchParamsCache.get('typeCategory');
  const status = searchParamsCache.get('status');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <SalesProductHeader />
        <SalesProductTableActions />
        <SalesProductList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialStatus={status}
          initialTypeCategory={typeCategory}
        />
      </div>
    </PageContainer>
  );
}
