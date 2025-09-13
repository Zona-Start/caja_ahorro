import PageContainer from '@/components/layout/page-container';
import {
  InventoryCategoriesHeader,
  InventoryCategoriesTableAction,
} from '@/feactures/administration/inventories/inventory-categories/components';
import InventoryCategoriesList from '@/feactures/administration/inventories/inventory-categories/components/inventory-categories-list';
import { searchParamsCache } from '@/feactures/administration/inventories/inventory-categories/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Categorias de Inventario',
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
  const group = searchParamsCache.get('group');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <InventoryCategoriesHeader />
        <InventoryCategoriesTableAction />
        <InventoryCategoriesList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialGroup={group}
        />
      </div>
    </PageContainer>
  );
}
