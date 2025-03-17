import PageContainer from '@/components/layout/page-container';
import { searchParamsCache } from '@/feactures/common/category-types/utils/searchparams';
import { AssociadtedTypeWrapper } from '@/feactures/savings-banks/partners/associated-types/associated-type-wrapper';
import { columns } from '@/feactures/savings-banks/partners/associated-types/columns';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipos de Categorias',
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
  const group = 'TIPOS_ASOCIADOS';

  return (
    <PageContainer scrollable={false}>
      <AssociadtedTypeWrapper
        page={page}
        search={search}
        pageLimit={pageLimit}
        group={group}
        columns={columns}
      />
    </PageContainer>
  );
}
