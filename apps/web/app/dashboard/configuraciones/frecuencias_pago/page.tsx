import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/feactures/common/category-types/utils/searchparams';
import { columns } from '@/feactures/configurations/frequency-type/columns';
import { FrequencyTypeWrapper } from '@/feactures/configurations/frequency-type/frequency-type-wrapper';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipos de Frecuencia',
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
  const group = 'FRECUENCIA_NOMINA';

  return (
    <PageContainer scrollable={false}>
      <FrequencyTypeWrapper
        page={page}
        search={search}
        pageLimit={pageLimit}
        group={group}
        columns={columns}
      />
    </PageContainer>
  );
}
