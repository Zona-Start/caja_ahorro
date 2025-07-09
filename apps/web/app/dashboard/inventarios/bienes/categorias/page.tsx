import PageContainer from '@/components/layout/page-container';
import { FixedAssetCategoriesHeader } from '@/feactures/inventories/assets/fixed-asset-categories/components/fixed-asset-categories-header';
import FixedAssetCategoriesList from '@/feactures/inventories/assets/fixed-asset-categories/components/fixed-asset-categories-list';
import { FixedAssetCategoriesTableAction } from '@/feactures/inventories/assets/fixed-asset-categories/components/fixed-asset-categories-tables/fixed-asset-categories-action';
import { searchParamsCache } from '@/feactures/inventories/assets/fixed-asset-categories/utils/searchparams';

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
        <FixedAssetCategoriesHeader />
        <FixedAssetCategoriesTableAction />
        <FixedAssetCategoriesList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
