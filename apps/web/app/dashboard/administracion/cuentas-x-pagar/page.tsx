import PageContainer from '@/components/layout/page-container';
import { AccountPayableHeader } from '@/feactures/administration/accounts-payable/components';
import AccountPayableList from '@/feactures/administration/accounts-payable/components/account-payable-list';
import AccountPayableTableAction from '@/feactures/administration/accounts-payable/components/account-payable-tables/account-payable-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/administration/accounts-payable/utils';

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
  const supplierInvoiceId = searchParamsCache.get('supplierInvoiceId');
  const supplierId = searchParamsCache.get('supplierId');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <AccountPayableHeader />
        <AccountPayableTableAction />
        <AccountPayableList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialSupplierInvoiceId={Number(supplierInvoiceId)}
          initialSupplierId={Number(supplierId)}
        />
      </div>
    </PageContainer>
  );
}
