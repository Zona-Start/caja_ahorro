import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/feactures/common/category-types/utils/searchparams';
import { columns } from '@/feactures/configurations/worker-type/columns';
import { WorkerTypeWrapper } from '@/feactures/configurations/worker-type/worker-type-wrapper';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipos de Trabajadores',
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
  const group = 'WORKING_TYPE';

  return (
    <PageContainer scrollable={false}>
      <WorkerTypeWrapper
        page={page}
        search={search}
        pageLimit={pageLimit}
        group={group}
        columns={columns}
      />
    </PageContainer>
  );
}
