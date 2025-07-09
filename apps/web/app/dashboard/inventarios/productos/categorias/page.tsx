import PageContainer from '@/components/layout/page-container';
import { SalesProductCategoriesHeader } from '@/feactures/inventories/sales/sales-product-categories/components/sales-product-categories-header';
import SalesProductCategoriesList from '@/feactures/inventories/sales/sales-product-categories/components/sales-product-categories-list';
import { SalesProductCategoriesTableAction } from '@/feactures/inventories/sales/sales-product-categories/components/sales-product-categories-tables/sales-product-categories-action';
import { searchParamsCache } from '@/feactures/savings-banks/assets/withdrawal-types/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Categoria de Productos',
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

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <SalesProductCategoriesHeader />
        <SalesProductCategoriesTableAction />
        <SalesProductCategoriesList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
