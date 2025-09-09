'use client';

import { SupplierPaymentHeader } from '@/feactures/administration/supplier-payments/components/supplier-payment-header';
import { SupplierPaymentTabs } from '@/feactures/administration/supplier-payments/components/supplier-payment-tabs';
import { searchParamsCache } from '@/feactures/administration/supplier-payments/utils/searchparams';

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function SupplierPaymentsPage({ searchParams }: Props) {
  const { page, limit, q, status, supplierId, startDate, endDate } =
    searchParamsCache.parse(searchParams);

  return (
    <div className="h-full">
      <SupplierPaymentHeader />
      <SupplierPaymentTabs
        initialPage={page}
        initialLimit={limit}
        initialSearch={q}
        initialStatus={status}
        initialSupplierId={supplierId}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
    </div>
  );
}
