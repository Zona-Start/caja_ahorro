import PageContainer from '@/components/layout/page-container';
import { SupplierPaymentHeader } from '@/feactures/administration/supplier-payments/components/supplier-payment-header';
import SupplierPaymentList from '@/feactures/administration/supplier-payments/components/supplier-payment-list';
import SupplierPaymentsTableActions from '@/feactures/administration/supplier-payments/components/tables/supplier-payments-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/administration/supplier-payments/utils/searchparams';
import { SearchParams } from 'nuqs';

export const metadata = {
  title: 'Dashboard: Pago a Proveedores',
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
  // const status = searchParamsCache.get('status');
  // const supplierId = searchParamsCache.get('supplierId');
  // const startDate = searchParamsCache.get('startDate');
  // const endDate = searchParamsCache.get('endDate');

  return (
    <PageContainer scrollable={false}>
      <div className="flex flex-1 flex-col space-y-6">
        <SupplierPaymentHeader />
        <SupplierPaymentsTableActions
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
        />
        <SupplierPaymentList />
      </div>
    </PageContainer>
  );
}
