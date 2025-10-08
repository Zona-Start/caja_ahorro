'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import { CustomCalendar } from '@repo/shadcn/custom-calendar';
import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useBankAccountAll } from '../../../bank-account/hooks/use-query-bank-account';
import { BankMovementModal } from '../bank-movement-modal';
import { useBankMovementTableFilters } from './use-bank-movement-table-filters';

export default function BankMovementTableAction() {
  const [open, setOpen] = useState(false);
  const {
    bankAccountId,
    setBankAccountId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useBankMovementTableFilters();

  const { data: bankAccounts } = useBankAccountAll();

  const bankAccountOptions =
    bankAccounts?.data?.map((acc) => ({
      value: acc.id!.toString(),
      label: `${acc.accountName} - ${acc.accountNumber}`,
    })) || [];

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableFilterBox
          filterKey="bankAccountId"
          title="Cuenta Bancaria"
          options={bankAccountOptions}
          setFilterValue={(value) =>
            setBankAccountId(value ? Number(value) : null)
          }
          filterValue={bankAccountId?.toString() ?? ''}
        />
        <div className="w-[200px]">
          <CustomCalendar
            value={startDate ? new Date(startDate) : null}
            onChange={(date) =>
              setStartDate(date?.toISOString().split('T')[0] || null)
            }
            placeholder="Fecha de inicio"
          />
        </div>
        <div className="w-[200px]">
          <CustomCalendar
            value={endDate ? new Date(endDate) : null}
            onChange={(date) =>
              setEndDate(date?.toISOString().split('T')[0] || null)
            }
            placeholder="Fecha de fin"
          />
        </div>
      </div>
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="mr-2 h-4 w-4" /> Crear Movimiento
      </Button>

      <BankMovementModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
