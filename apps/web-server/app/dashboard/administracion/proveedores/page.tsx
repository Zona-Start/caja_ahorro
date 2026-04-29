import PageContainer from '@/components/layout/page-container';
import { SupplierHeader } from '@/feactures/administration/suppliers/components/suppliers-header';
import SupplierList from '@/feactures/administration/suppliers/components/suppliers-list';
import SupplierTableAction from '@/feactures/administration/suppliers/components/suppliers-tables/suppliers-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/administration/suppliers/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Proveedores',
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
  const category = searchParamsCache.get('category');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <SupplierHeader />
        <SupplierTableAction />
        <SupplierList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialCategory={category}
        />
      </div>
    </PageContainer>
  );
}
