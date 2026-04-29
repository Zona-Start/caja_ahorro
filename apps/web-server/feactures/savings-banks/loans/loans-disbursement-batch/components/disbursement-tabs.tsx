'use client';
import { Badge } from '@repo/shadcn/badge';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/shadcn/components/ui/command';
import { Input } from '@repo/shadcn/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApprovedItemsDataTable } from './approved-items-data-table';
import {
  getLoanDisbursementBatchColumns,
  LoanDisbursementBatchApprovedItem,
} from './loan-disbursement/batch-columns';
import { SelectedItem } from './loan-disbursement/batch-types';

interface DisbursementTabsProps {
  approvedLoans: LoanDisbursementBatchApprovedItem[];
  approvedWithdrawals: LoanDisbursementBatchApprovedItem[];
  approvedLiquidations: LoanDisbursementBatchApprovedItem[];
  selectedItems: SelectedItem[];
  onSelectionChange: (newSelected: SelectedItem[]) => void;
}

export function DisbursementTabs({
  approvedLoans,
  approvedWithdrawals,
  approvedLiquidations,
  selectedItems,
  onSelectionChange,
}: DisbursementTabsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCommand, setOpenCommand] = useState(false);
  const [activeTab, setActiveTab] = useState('loans');

  // Shortcuts for CMD+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filterItems = (items: LoanDisbursementBatchApprovedItem[]) => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.associateName.toLowerCase().includes(lowerQuery) ||
        item.associateCedula.toLowerCase().includes(lowerQuery),
    );
  };

  const filteredLoans = useMemo(
    () => filterItems(approvedLoans),
    [approvedLoans, searchQuery],
  );
  const filteredWithdrawals = useMemo(
    () => filterItems(approvedWithdrawals),
    [approvedWithdrawals, searchQuery],
  );
  const filteredLiquidations = useMemo(
    () => filterItems(approvedLiquidations),
    [approvedLiquidations, searchQuery],
  );

  // Helper to handle row selection from tables
  const handleTableSelection = (
    type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION',
    rowSelection: Record<string, boolean>,
  ) => {
    // 1. Get all currently selected items of other types
    const otherTypeItems = selectedItems.filter((i) => i.type !== type);

    // 2. Convert rowSelection (which assumes rowId is stringified ID) to SelectedItem[]
    const newTypeItems: SelectedItem[] = Object.keys(rowSelection).map(
      (id) => ({
        type,
        sourceId: Number(id),
      }),
    );

    // 3. Merge
    onSelectionChange([...otherTypeItems, ...newTypeItems]);
  };

  // Compute rowSelection state for current tab tables
  const getRowSelection = (type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION') => {
    const selection: Record<string, boolean> = {};
    selectedItems
      .filter((i) => i.type === type)
      .forEach((i) => {
        selection[i.sourceId.toString()] = true;
      });
    return selection;
  };

  // For Command Palette
  const allSearchableItems = useMemo(
    () => [
      ...approvedLoans.map((i) => ({ ...i, type: 'LOAN' as const })),
      ...approvedWithdrawals.map((i) => ({
        ...i,
        type: 'WITHDRAWAL' as const,
      })),
      ...approvedLiquidations.map((i) => ({
        ...i,
        type: 'LIQUIDATION' as const,
      })),
    ],
    [approvedLoans, approvedWithdrawals, approvedLiquidations],
  );

  const toggleSelection = (
    type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION',
    id: number,
  ) => {
    const exists = selectedItems.find(
      (i) => i.type === type && i.sourceId === id,
    );
    if (exists) {
      onSelectionChange(
        selectedItems.filter((i) => !(i.type === type && i.sourceId === id)),
      );
    } else {
      onSelectionChange([...selectedItems, { type, sourceId: id }]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o cédula..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          Presiona{' '}
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="Búsqueda global..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup heading="Resultados">
            {allSearchableItems.map((item) => {
              const uniqueKey = `${item.type}-${item.id}`;
              const isSelected = selectedItems.some(
                (sel) => sel.type === item.type && sel.sourceId === item.id,
              );
              return (
                <CommandItem
                  key={uniqueKey}
                  value={`${item.associateName} ${item.associateCedula} ${item.reference}`}
                  onSelect={() => {
                    toggleSelection(item.type, item.id);
                    setOpenCommand(false);
                    // switch tab?
                    if (item.type === 'LOAN') setActiveTab('loans');
                    if (item.type === 'WITHDRAWAL') setActiveTab('withdrawals');
                    if (item.type === 'LIQUIDATION') setActiveTab('liquidations');
                  }}
                >
                  <div className="flex items-center w-full justify-between">
                    <div className="flex flex-col">
                      <span>{item.associateName}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.type} - {item.associateCedula}
                      </span>
                    </div>
                    {isSelected && <Badge variant="secondary">Seleccionado</Badge>}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="loans" className="flex gap-2">
            Préstamos
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {filteredLoans.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex gap-2">
            Retiros
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {filteredWithdrawals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="liquidations" className="flex gap-2">
            Liquidaciones
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {filteredLiquidations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-4">
          <ApprovedItemsDataTable
            columns={getLoanDisbursementBatchColumns('LOAN')}
            data={filteredLoans}
            rowSelection={getRowSelection('LOAN')}
            onRowSelectionChange={(sel) => handleTableSelection('LOAN', sel)}
          />
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-4">
          <ApprovedItemsDataTable
            columns={getLoanDisbursementBatchColumns('WITHDRAWAL')}
            data={filteredWithdrawals}
            rowSelection={getRowSelection('WITHDRAWAL')}
            onRowSelectionChange={(sel) =>
              handleTableSelection('WITHDRAWAL', sel)
            }
          />
        </TabsContent>
        <TabsContent value="liquidations" className="mt-4">
          <ApprovedItemsDataTable
            columns={getLoanDisbursementBatchColumns('LIQUIDATION')}
            data={filteredLiquidations}
            rowSelection={getRowSelection('LIQUIDATION')}
            onRowSelectionChange={(sel) =>
              handleTableSelection('LIQUIDATION', sel)
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
