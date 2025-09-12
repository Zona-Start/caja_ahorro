'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { useEffect } from 'react';
import { useSupplierPayments } from '../hooks';
import { useAccountsPayable } from '../hooks/use-query-accounts-payable';
import { useAccountPayableStore } from '../store/accounts-payable-store';
import { useSupplierPaymentStore } from '../store/supplier-payment-store';

interface TabsProps {
  tab: string;
  setTab: (tab: string) => void; // This setTab now expects the handler from parent
  initialPage: number;
  initialSearch?: string | null;
  initialLimit: number;
  statusFilter: string | null;
  supplierIdFilter: number | null;
}

const HISTORY_SUPPLIER_PAYMENT_STATUSES = [
  'PROCESSED',
  'REJECTED',
  'REVERSED',
  'CANCELLED',
];

const PENDING_ACCOUNTS_PAYABLE_STATUSES = [
  'PENDING',
  'IN_PROGRESS',
  'EXPIRED',
  'ADVANCE',
];

export function SupplierPaymentTabs({
  tab,
  setTab,
  initialPage,
  initialSearch,
  initialLimit,
  statusFilter,
  supplierIdFilter,
}: TabsProps) {
  const isHistoryTab = tab === 'history';

  // Filters for history tab (Supplier Payments)
  const historyStatus = statusFilter
    ? [statusFilter]
    : HISTORY_SUPPLIER_PAYMENT_STATUSES;
  const historyFilters = {
    page: initialPage,
    limit: initialLimit,
    status: historyStatus,
    ...(initialSearch && { search: initialSearch }),
    ...(supplierIdFilter && { supplierIds: [supplierIdFilter] }),
  };

  // Filters for pending tab (Accounts Payable)
  const pendingStatus = statusFilter
    ? [statusFilter]
    : PENDING_ACCOUNTS_PAYABLE_STATUSES;
  const pendingFilters = {
    page: initialPage,
    limit: initialLimit,
    status: pendingStatus,
    ...(initialSearch && { search: initialSearch }),
    ...(supplierIdFilter && { supplierIds: [supplierIdFilter] }),
  };

  // consulta de datos
  const { data: supplierPaymentsData, isLoading: supplierPaymentsLoading } =
    useSupplierPayments(historyFilters, { enabled: isHistoryTab });

  const { data: accountsPayableData, isLoading: accountsPayableLoading } =
    useAccountsPayable(pendingFilters, { enabled: !isHistoryTab });

  // llamada a store
  const {
    setData: setSupplierPaymentData,
    setLoading: setSupplierPaymentLoading,
  } = useSupplierPaymentStore();
  const {
    setData: setAccountPayableData,
    setLoading: setAccountPayableLoading,
  } = useAccountPayableStore();

  //efect para aplicar datos al store
  useEffect(() => {
    if (isHistoryTab) {
      setSupplierPaymentLoading(supplierPaymentsLoading);
      if (supplierPaymentsData) {
        setSupplierPaymentData(
          supplierPaymentsData.data,
          supplierPaymentsData.meta,
        );
      }
    } else {
      setAccountPayableLoading(accountsPayableLoading);
      if (accountsPayableData) {
        setAccountPayableData(
          accountsPayableData.data,
          accountsPayableData.meta,
        );
      }
    }
  }, [
    isHistoryTab,
    supplierPaymentsData,
    supplierPaymentsLoading,
    accountsPayableData,
    accountsPayableLoading,
    setSupplierPaymentData,
    setSupplierPaymentLoading,
    setAccountPayableData,
    setAccountPayableLoading,
  ]);

  return (
    <Tabs value={tab} onValueChange={setTab} defaultValue="history">
      <TabsList>
        <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
        <TabsTrigger value="pending">Pagos Pendientes</TabsTrigger>
      </TabsList>
      <TabsContent value="pending"></TabsContent>
      <TabsContent value="history"></TabsContent>
    </Tabs>
  );
}
