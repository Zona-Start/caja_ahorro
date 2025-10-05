'use client';

import { SelectSearchable } from '@repo/shadcn/components/ui/select-searchable';
import { DataTableFilterBox } from '@repo/shadcn/components/ui/table/data-table-filter-box';
import { DataTableSearch } from '@repo/shadcn/components/ui/table/data-table-search';

import { Button } from '@repo/shadcn/components/ui/button';
import { BookMarked, CreditCard, FileText } from 'lucide-react';
import { useState } from 'react';
import { useSupplierAll } from '../../../suppliers/hooks/use-query-suppliers';
import { AdvancePaymentModal } from '../advance-payment-modal';
import { CreditDebitNoteModal } from '../credit-debit-note-modal';
import { ManageDocumentsModal } from '../manage-documents/manage-documents-modal';
import {
  ACCOUNT_PAYABLE_STATUS_OPTIONS,
  useAccountPayableFilters,
} from './use-account-payable-filters';

export default function AccountPayableTableAction() {
  const {
    statusFilter,
    setStatusFilter,
    searchQuery,
    setPage,
    setSearchQuery,
    supplierIdFilter,
    setSupplierIdFilter,
  } = useAccountPayableFilters();

  const [openAdvanceModal, setOpenAdvanceModal] = useState(false);
  const [openCreditDebitNoteModal, setOpenCreditDebitNoteModal] =
    useState(false);
  const [manageDocumentsModalOpen, setManageDocumentsModalOpen] =
    useState(false);
  const { data: suppliers } = useSupplierAll();

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por referencia"
          searchKey={searchQuery}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
          w="w-48 md:max-w-sm"
        />
        <div className="w-[200px] p-0">
          <SelectSearchable
            placeholder="Filtrar por proveedor"
            options={
              suppliers?.map((supplier) => ({
                value: supplier.id!.toString(),
                label: supplier.name,
              })) || []
            }
            onValueChange={(value) => {
              setSupplierIdFilter(value ? Number(value) : null);
            }}
            defaultValue={supplierIdFilter?.toString()}
            enableNoneOption
          />
        </div>
        <DataTableFilterBox
          filterKey="status"
          title="Estatus"
          options={ACCOUNT_PAYABLE_STATUS_OPTIONS}
          setFilterValue={setStatusFilter}
          filterValue={statusFilter}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => setManageDocumentsModalOpen(true)} size="sm">
          <BookMarked className="h-4 w-4 " /> Gestionar Documentos
        </Button>
        <Button onClick={() => setOpenAdvanceModal(true)} size="sm">
          <CreditCard className="h-4 w-4 " /> Anticipos
        </Button>
        <Button onClick={() => setOpenCreditDebitNoteModal(true)} size="sm">
          <FileText className="h-4 w-4 " />
          Notas C/D
        </Button>
      </div>

      <AdvancePaymentModal
        open={openAdvanceModal}
        onOpenChange={setOpenAdvanceModal}
      />
      <CreditDebitNoteModal
        open={openCreditDebitNoteModal}
        onOpenChange={setOpenCreditDebitNoteModal}
      />
      <ManageDocumentsModal
        open={manageDocumentsModalOpen}
        onOpenChange={setManageDocumentsModalOpen}
      />
    </div>
  );
}
