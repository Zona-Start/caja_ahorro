import PageContainer from '@/components/layout/page-container';
import { SettingSystemHeader } from '@/feactures/configurations/system-properties/components/system-properties-header';
import SettingSystemList from '@/feactures/configurations/system-properties/components/system-properties-list';
import SettingSystemTableAction from '@/feactures/configurations/system-properties/components/system-properties-tables/system-properties-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/configurations/system-properties/utils/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Propiedades del Sistema',
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
  const type = searchParamsCache.get('type');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-4">
        <SettingSystemHeader />
        <SettingSystemTableAction />
        <SettingSystemList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialType={type}
        />
      </div>
    </PageContainer>
  );
}
