import PageContainer from '@/components/layout/page-container';
import { AccountingRuleHeader } from '@/feactures/accounting/accounting-rules/components/accounting-rule-header';
import AccountingRulesList from '@/feactures/accounting/accounting-rules/components/accounting-rules-list';
import AccountingRuleTableAction from '@/feactures/accounting/accounting-rules/components/tables/accounting-rule-table-action';
import { searchParamsCache } from '@/feactures/accounting/accounting-rules/utils/searchparams';

export const metadata = {
  title: 'Dashboard: Configuraciones Contables',
};

type pageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
        <AccountingRuleHeader />
        <AccountingRuleTableAction />
        <AccountingRulesList
          initialPage={page}
          initialLimit={limit}
          initialSearch={search}
        />
      </div>
    </PageContainer>
  );
}
