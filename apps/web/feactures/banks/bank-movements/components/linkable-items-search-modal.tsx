'use client';

import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { ModalDataTable } from '@repo/shadcn/table/modal-data-table';
import { RowSelectionState } from '@tanstack/react-table';
import { useState } from 'react';
import { useGetLinkables } from '../hooks/use-get-linkables';
import { BankTransactionCategory } from '../schemas/bank-movement-options';
import { useLinkableStore } from '../store/use-linkable-store';
import { columns } from './tables/linkable-items-columns';

import { CustomCalendar } from '@repo/shadcn/components/ui/custom-calendar';

// ... imports

interface LinkableItemsSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: BankTransactionCategory;
}

export function LinkableItemsSearchModal({
  open,
  onOpenChange,
  category,
}: LinkableItemsSearchModalProps) {
  const [q, setQ] = useState('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const { addItems } = useLinkableStore();

  const { data, isLoading } = useGetLinkables({
    category,
    q: q,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    enabled: open && !!category,
  });

  const tableData = data?.data ?? [];
  const totalItems = data?.meta.totalCount ?? 0;

  const handleConfirm = () => {
    const selectedData = tableData.filter((_, index) => rowSelection[index]);
    addItems(selectedData);
    onOpenChange(false);
    setRowSelection({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] z-50 backdrop-blur-lg flex flex-col max-h-[90vh] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Buscar Operaciones Vinculables</DialogTitle>
          <DialogDescription>
            Seleccione una o varias operaciones para vincular al movimiento
            bancario.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-4">
          <Input
            placeholder="Filtrar por concepto, fecha o monto..."
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-4">
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
        </div>
        <div className="flex-1 flex flex-col">
          <ModalDataTable
            columns={columns}
            data={tableData}
            totalItems={totalItems}
            pageSizeOptions={[10, 20, 30, 50, 100]}
            isLoading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Selección</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
