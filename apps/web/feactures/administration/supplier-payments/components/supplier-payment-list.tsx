'use client';

import SupplierPaymentDataTable from './supplier-payment-data-table';

interface ListProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  initialStatus?: string | null;
  initialSupplierId?: number | null;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

export default function SupplierPaymentList(props: ListProps) {
  return <SupplierPaymentDataTable {...props} />;
}
