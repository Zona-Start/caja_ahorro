import { Badge } from '@repo/shadcn/badge';
import { Input } from '@repo/shadcn/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApprovedItemsDataTable } from './approved-items-data-table';
import {
  getApprovedItemColumns,
  type PaymentBatchApprovedItem,
} from './payment-batch-columns';

interface InfiniteScrollProps {
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  totalCount?: number;
}

interface DisbursementTabsProps {
  approvedLoans: PaymentBatchApprovedItem[];
  approvedWithdrawals: PaymentBatchApprovedItem[];
  approvedLiquidations: PaymentBatchApprovedItem[];
  selectedItems: { type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION'; sourceId: string }[];
  onSelectionChange: (newSelected: { type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION'; sourceId: string }[]) => void;
  isLoadingLoans?: boolean;
  isLoadingWithdrawals?: boolean;
  isLoadingLiquidations?: boolean;
  loansPagination?: InfiniteScrollProps;
  withdrawalsPagination?: InfiniteScrollProps;
  liquidationsPagination?: InfiniteScrollProps;
}

export function DisbursementTabs({
  approvedLoans,
  approvedWithdrawals,
  approvedLiquidations,
  selectedItems,
  onSelectionChange,
  isLoadingLoans,
  isLoadingWithdrawals,
  isLoadingLiquidations,
  loansPagination,
  withdrawalsPagination,
  liquidationsPagination,
}: DisbursementTabsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('loans');

  const filterItems = (items: PaymentBatchApprovedItem[]) => {
    if (!searchQuery) return items;
    const lowerQuery = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.associateName?.toLowerCase().includes(lowerQuery) ||
        item.associateCedula?.toLowerCase().includes(lowerQuery) ||
        item.reference?.toLowerCase().includes(lowerQuery),
    );
  };

  const filteredLoans = useMemo(() => filterItems(approvedLoans), [approvedLoans, searchQuery]);
  const filteredWithdrawals = useMemo(() => filterItems(approvedWithdrawals), [approvedWithdrawals, searchQuery]);
  const filteredLiquidations = useMemo(() => filterItems(approvedLiquidations), [approvedLiquidations, searchQuery]);

  const handleTableSelection = (
    type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION',
    rowSelection: Record<string, boolean>,
  ) => {
    const otherTypeItems = selectedItems.filter((i) => i.type !== type);
    const newTypeItems = Object.keys(rowSelection).map((id) => ({
      type,
      sourceId: id,
    }));
    onSelectionChange([...otherTypeItems, ...newTypeItems]);
  };

  const getRowSelection = (type: 'LOAN' | 'WITHDRAWAL' | 'LIQUIDATION') => {
    const selection: Record<string, boolean> = {};
    selectedItems.filter((i) => i.type === type).forEach((i) => {
      selection[i.sourceId] = true;
    });
    return selection;
  };

  const loansCount = loansPagination?.totalCount ?? approvedLoans.length;
  const withdrawalsCount = withdrawalsPagination?.totalCount ?? approvedWithdrawals.length;
  const liquidationsCount = liquidationsPagination?.totalCount ?? approvedLiquidations.length;

  const selectedLoansCount = selectedItems.filter((i) => i.type === 'LOAN').length;
  const selectedWithdrawalsCount = selectedItems.filter((i) => i.type === 'WITHDRAWAL').length;
  const selectedLiquidationsCount = selectedItems.filter((i) => i.type === 'LIQUIDATION').length;

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, cédula o referencia..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="loans" className="flex gap-2">
            Préstamos
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {selectedLoansCount > 0 ? `${selectedLoansCount}/${loansCount}` : loansCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex gap-2">
            Retiros
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {selectedWithdrawalsCount > 0 ? `${selectedWithdrawalsCount}/${withdrawalsCount}` : withdrawalsCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="liquidations" className="flex gap-2">
            Liquidaciones
            <Badge variant="secondary" className="px-1.5 py-0.5 text-xs">
              {selectedLiquidationsCount > 0 ? `${selectedLiquidationsCount}/${liquidationsCount}` : liquidationsCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loans" className="mt-4">
          <ApprovedItemsDataTable
            columns={getApprovedItemColumns('LOAN')}
            data={filteredLoans}
            rowSelection={getRowSelection('LOAN')}
            onRowSelectionChange={(sel) => handleTableSelection('LOAN', sel)}
            isLoading={isLoadingLoans}
            fetchNextPage={loansPagination?.fetchNextPage}
            hasNextPage={loansPagination?.hasNextPage}
            isFetchingNextPage={loansPagination?.isFetchingNextPage}
            totalCount={loansPagination?.totalCount}
          />
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-4">
          <ApprovedItemsDataTable
            columns={getApprovedItemColumns('WITHDRAWAL')}
            data={filteredWithdrawals}
            rowSelection={getRowSelection('WITHDRAWAL')}
            onRowSelectionChange={(sel) => handleTableSelection('WITHDRAWAL', sel)}
            isLoading={isLoadingWithdrawals}
            fetchNextPage={withdrawalsPagination?.fetchNextPage}
            hasNextPage={withdrawalsPagination?.hasNextPage}
            isFetchingNextPage={withdrawalsPagination?.isFetchingNextPage}
            totalCount={withdrawalsPagination?.totalCount}
          />
        </TabsContent>
        <TabsContent value="liquidations" className="mt-4">
          <ApprovedItemsDataTable
            columns={getApprovedItemColumns('LIQUIDATION')}
            data={filteredLiquidations}
            rowSelection={getRowSelection('LIQUIDATION')}
            onRowSelectionChange={(sel) => handleTableSelection('LIQUIDATION', sel)}
            isLoading={isLoadingLiquidations}
            fetchNextPage={liquidationsPagination?.fetchNextPage}
            hasNextPage={liquidationsPagination?.hasNextPage}
            isFetchingNextPage={liquidationsPagination?.isFetchingNextPage}
            totalCount={liquidationsPagination?.totalCount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
