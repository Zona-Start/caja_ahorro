import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/feactures/common/category-types/utils/searchparams';
import { DaysTypeWrapper } from '@/feactures/configurations/days-type/days-type-wrapper';
import { columns } from '@/feactures/configurations/worker-type/columns';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipos de Jornadas',
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
  const group = 'DAYS_TYPE';

  return (
    <PageContainer scrollable={false}>
      <DaysTypeWrapper
        page={page}
        search={search}
        pageLimit={pageLimit}
        group={group}
        columns={columns}
      />
    </PageContainer>
  );
}
