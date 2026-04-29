import PageContainer from '@/components/layout/page-container';
import CreditsTableAction from '@/feactures/savings-banks/credits/credits-management/components/credits-tables/ordinary-credits-table-action';
import { CreditsHeader } from '@/feactures/savings-banks/credits/credits-management/components/ordinary-credits-header';
import CreditsList from '@/feactures/savings-banks/credits/credits-management/components/ordinary-credits-list';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/credits/credits-management/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gestion de Créditos',
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
  const type = searchParamsCache.get('type');
  const modality = searchParamsCache.get('modality');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <CreditsHeader />
        <CreditsTableAction />
        <CreditsList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialType={type}
          inititalModality={modality}
        />
      </div>
    </PageContainer>
  );
}
