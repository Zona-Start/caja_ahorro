import PageContainer from '@/components/layout/page-container';
import { SupplierInvoiceHeader } from '@/feactures/administration/supplier-invoices/components';
import SupplierInvoiceList from '@/feactures/administration/supplier-invoices/components/supplier-invoice-list';
import SupplierInvoiceTableAction from '@/feactures/administration/supplier-invoices/components/supplier-invoice-tables/supplier-invoices-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/administration/supplier-invoices/utils';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Recepción de facturas',
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
  const supplierId = searchParamsCache.get('supplierId');
  const startDate = searchParamsCache.get('startDate');
  const endDate = searchParamsCache.get('endDate');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <SupplierInvoiceHeader />
        <SupplierInvoiceTableAction />
        <SupplierInvoiceList
          initialStatus={status}
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialSupplierId={supplierId}
          initialStartDate={startDate}
          initialEndDate={endDate}
        />
      </div>
    </PageContainer>
  );
}
