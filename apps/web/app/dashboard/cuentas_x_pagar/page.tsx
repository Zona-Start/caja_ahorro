import PageContainer from '@/components/layout/page-container';
import { InvoicePayableHeader } from '@/feactures/accounts-payable/invoices-payable/components/invoices-payable-header';
import InvoicePayableList from '@/feactures/accounts-payable/invoices-payable/components/invoices-payable-list';
import InvoicePayableTableAction from '@/feactures/accounts-payable/invoices-payable/components/invoices-payable-tables/invoices-payable-table-action';
import { searchParamsCache, serialize } from '@/feactures/accounts-payable/invoices-payable/utils/searchparams';


import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Cuentas por pagar',
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


  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <InvoicePayableHeader />
        <InvoicePayableTableAction />
        <InvoicePayableList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
      </div>
    </PageContainer>
  );
}
