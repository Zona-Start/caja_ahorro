'use client';
import { ACCOUNT_PAYABLE_STATUS_TYPES } from '@/feactures/administration/accounts-payable/schemas';
import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { DataTableFilterBox } from '@repo/shadcn/components/ui/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/components/ui/table/data-table-search';
import { useMemo, useState } from 'react';
import { useSupplierAll } from '../../../suppliers/hooks/use-query-suppliers'; // Import useSupplierAll
import { SUPPLIER_PAYMENT_STATUS_TYPES } from '../../schemas'; // Import status types
import { MassivePaymentModal } from '../massive-payment-modal';
import { ReversePaymentModal } from '../reverse-payment-modal';
import { SupplierPaymentTabs } from '../supplier-payment-tabs';
import { useSupplierPaymentsFilters } from './use-supplier-payments-filters';

interface DataTableProps {
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
}

const PENDING_STATUSES_OPTIONS = ['PENDING', 'IN_PROGRESS', 'EXPIRED'].map(
  (status) => ({
    value: status,
    label:
      ACCOUNT_PAYABLE_STATUS_TYPES[
        status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES
      ],
  }),
);

const HISTORY_STATUSES_OPTIONS = [
  'PROCESSED',
  'REJECTED',
  'REVERSED',
  'CANCELLED',
].map((status) => ({
  value: status,
  label:
    SUPPLIER_PAYMENT_STATUS_TYPES[
      status as keyof typeof SUPPLIER_PAYMENT_STATUS_TYPES
    ],
}));

export default function SupplierPaymentsTableActions({
  initialPage,
  initialSearch,
  initialLimit,
}: DataTableProps) {
  const {
    searchQuery,
    setPage,
    setSearchQuery,
    tab,
    setTab,
    statusFilter,
    setStatusFilter,
    supplierIdFilter,
    setSupplierIdFilter,
  } = useSupplierPaymentsFilters();

  const { data: suppliers } = useSupplierAll(); // Fetch suppliers
  const [openMassivePaymentModal, setOpenMassivePaymentModal] = useState(false);
  const [openReversePaymentModal, setOpenReversePaymentModal] = useState(false);

  const statusOptions = useMemo(() => {
    return tab === 'pending'
      ? PENDING_STATUSES_OPTIONS
      : HISTORY_STATUSES_OPTIONS;
  }, [tab]);

  const handleTabChange = (newTab: string) => {
    setTab(newTab);
    setStatusFilter(null); // Reset status filter on tab change
    setSupplierIdFilter(null); // Reset supplier filter on tab change
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex items-center justify-between">
        <SupplierPaymentTabs
          tab={tab!}
          setTab={handleTabChange} // Pass the new handler
          initialPage={initialPage}
          initialLimit={initialLimit}
          initialSearch={initialSearch}
          statusFilter={statusFilter}
          supplierIdFilter={supplierIdFilter}
        />
      </div>

      <div className="flex items-center gap-2 flex-grow">
        <DataTableSearch
          title="Buscar por referencia..."
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={statusOptions}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
        <div className="w-[300px]">
          <SelectSearchable
            options={
              suppliers?.map((s) => ({
                value: s.id!.toString(),
                label: s.name,
              })) || []
            }
            onValueChange={(value) =>
              setSupplierIdFilter(value ? Number(value) : null)
            } // Handle null for clear
            placeholder="Filtrar por proveedor"
            defaultValue={supplierIdFilter?.toString()}
          />
        </div>

        <div className="flex gap-2">
          {/* {tab === 'pending' && (
            <Button onClick={() => setOpenMassivePaymentModal(true)} size="sm">
              <DollarSign className="h-4 w-4" /> Pagos Masivos
            </Button>
          )} */}
          {/* {tab === 'history' && (
            <Button onClick={() => setOpenReversePaymentModal(true)} size="sm">
              <CreditCard className="h-4 w-4" /> Reversar Pagos
            </Button>
          )} */}
        </div>
      </div>

      <MassivePaymentModal
        open={openMassivePaymentModal}
        onOpenChange={setOpenMassivePaymentModal}
      />
      <ReversePaymentModal
        open={openReversePaymentModal}
        onOpenChange={setOpenReversePaymentModal}
      />
    </div>
  );
}
