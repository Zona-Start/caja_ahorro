import PageContainer from '@/components/layout/page-container';
import { TypePayrollHeader } from '@/feactures/configurations/type-payroll/components/type-payroll-header';
import TypePayrollList from '@/feactures/configurations/type-payroll/components/type-payroll-list';
import TypePayrollTableAction from '@/feactures/configurations/type-payroll/components/type-payroll-tables/type-payroll-action';
import { searchParamsCache } from '@/feactures/configurations/type-payroll/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Tipo Operaciones',
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
        <TypePayrollHeader />
        <TypePayrollTableAction />
        <TypePayrollList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialGroup={group}
        />
      </div>
    </PageContainer>
  );
}
