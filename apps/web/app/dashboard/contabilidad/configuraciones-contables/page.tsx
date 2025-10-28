import PageContainer from '@/components/layout/page-container';
import { AccountingConfigurationHeader } from '@/feactures/accounting/accounting-configurations/components/accounting-configuration-header';
import AccountingConfigurationsList from '@/feactures/accounting/accounting-configurations/components/accounting-configurations-list';
import AccountingConfigurationTableAction from '@/feactures/accounting/accounting-configurations/components/tables/accounting-configuration-table-action';
import { searchParamsCache } from '@/feactures/accounting/accounting-configurations/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Configuraciones Contables',
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);
  const page = Number(searchParamsCache.get('page')) || 1;
  const limit = Number(searchParamsCache.get('limit')) || 10;
  const search = searchParamsCache.get('q') || null;

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <AccountingConfigurationHeader />
        <AccountingConfigurationTableAction />
        <AccountingConfigurationsList
          initialPage={page}
          initialLimit={limit}
          initialSearch={search}
        />
      </div>
    </PageContainer>
  );
}
