'use client';

import { useBanksQuery } from '@/feactures/banks/bank-directory/hooks/use-banks-querys';
import { Button } from '@repo/shadcn/button';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import {
  LOAN_PAYMENT_TYPES_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  useAssociatesTableFilters,
} from './use-loans-paid-filters';
import { LoansPaidBulkUploadModal } from '../loans-paid-bulk-upload-modal';
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { ExportLoanPaidButton } from '../export-bottom';

export default function LoansPaidTableAction() {
  const {
    bankFilter,
    setBankFilter,
    typeFilter,
    setTypeFilter,
    searchQuery,
    setPage,
    setSearchQuery,
    setMethodFilter,
    methodFilter,
  } = useAssociatesTableFilters();

  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: Banks } = useBanksQuery();
  const BANK_DIRECTORY_OPTIONS =
    Banks?.data?.map((bank) => ({
      value: bank?.id?.toString() ?? '',
      label: bank?.name ?? '',
    })) ?? [];

  const currentFilters = {
    page: 1,
    limit: 10,
    search: searchQuery,
    bank: bankFilter,
    type: typeFilter,
    method: methodFilter,
  };

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por código"
          searchKey={String(/^\d/.test(searchQuery || ''))}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        <DataTableFilterBox
          filterKey="type"
          title="Tipo Operación"
          options={LOAN_PAYMENT_TYPES_OPTIONS}
          setFilterValue={setTypeFilter}
          filterValue={typeFilter}
        />
        <DataTableFilterBox
          filterKey="modality"
          title="Metodo"
          options={PAYMENT_METHOD_OPTIONS}
          setFilterValue={setMethodFilter}
          filterValue={methodFilter}
        />
      </div>
      <div className="flex gap-2">
        <ExportLoanPaidButton currentFilters={currentFilters} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBulkOpen(true)}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Carga Masiva
        </Button>
        <Link href="/dashboard/prestamos/pagos/nuevo">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Nuevo Pago
          </Button>
        </Link>
      </div>
      <LoansPaidBulkUploadModal open={bulkOpen} onOpenChange={setBulkOpen} />
    </div>
  );
}
