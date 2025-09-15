import PageContainer from '@/components/layout/page-container';
import { PaymentBatchHeader } from '@/feactures/savings-banks/assets/paymentBatch/components/payment-batch-header';
import PaymentBatchList from '@/feactures/savings-banks/assets/paymentBatch/components/payment-batch-list';
import PaymentBatchTableAction from '@/feactures/savings-banks/assets/paymentBatch/components/payment-batch-tables/payment-batch-table-action';
import {
  searchParamsCache,
  serialize,
} from '@/feactures/savings-banks/assets/paymentBatch/utils/searchparams';

import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Gestion de Retiros Haberes',
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
        <PaymentBatchHeader />
        <PaymentBatchTableAction />
        <PaymentBatchList
          initialPage={page}
          initialSearch={search}
          initialLimit={pageLimit}
          initialStatus={status}
        />
      </div>
    </PageContainer>
  );
}
