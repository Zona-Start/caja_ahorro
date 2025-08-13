import PageContainer from '@/components/layout/page-container';
import FixedAssetHeader from '@/feactures/administration/inventories/fixed-asset/components/fixed-asset-header';
import FixedAssetList from '@/feactures/administration/inventories/fixed-asset/components/fixed-asset-list';
import TableActions from '@/feactures/administration/inventories/fixed-asset/components/fixed-asset-tables/table-actions';
import { searchParamsCache } from '@/feactures/administration/inventories/fixed-asset/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Bienes',
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
        <FixedAssetHeader />
        <TableActions />
        <FixedAssetList
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
