import { Button } from '@repo/shadcn/button';
import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
import { FileLock, FileUp, TableRowsSplit } from 'lucide-react';
import { useState } from 'react';
import { useAccountingCycles } from '../../../accounting-cycles/hooks/use-accounting-cycles-query';
import { usePaginatedAccountingBalances } from '../../hooks/use-accounting-balances-query';
import { BootstrappingModal } from '../bootstrapping-modal';
import { CloseCycleModal } from '../close-cycle-modal';
import { OpenCycleModal } from '../open-cycle-modal';
import { useAccountingBalancesFilters } from '../../hooks/use-accounting-balances-filters';

export function AccountingBalanceTableAction() {
  const { filters, setFilters } = useAccountingBalancesFilters();
  const [isBootstrappingOpen, setIsBootstrappingOpen] = useState(false);
  const [isCloseCycleOpen, setIsCloseCycleOpen] = useState(false);
  const [isOpenCycleOpen, setIsOpenCycleOpen] = useState(false);

  const { data: cyclesData } = useAccountingCycles();
  const { data: balancesData } = usePaginatedAccountingBalances({ limit: 1 });

  const hasOpenCycle = cyclesData?.some((c: any) => c.status === 'OPEN');
  const hasBalances = (balancesData?.meta?.totalCount || 0) > 0;

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por código o nombre"
          searchKey="search"
          searchQuery={filters.search || ''}
          setSearchQuery={(v) => setFilters({ search: v, page: 1 })}
          setPage={(p) => setFilters({ page: p })}
        />
      </div>
      <div className="flex gap-2">
        {!hasBalances && (
          <Button
            variant="outline"
            onClick={() => setIsBootstrappingOpen(true)}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Carga Inicial
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => setIsCloseCycleOpen(true)}
          disabled={!hasOpenCycle || !hasBalances}
        >
          <FileLock className="mr-2 h-4 w-4" />
          Cierre Contable
        </Button>

        <Button
          onClick={() => setIsOpenCycleOpen(true)}
          disabled={hasOpenCycle}
        >
          <TableRowsSplit className="mr-2 h-4 w-4" />
          Apertura Contable
        </Button>
      </div>

      <BootstrappingModal
        open={isBootstrappingOpen}
        onOpenChange={setIsBootstrappingOpen}
      />
      <CloseCycleModal
        open={isCloseCycleOpen}
        onOpenChange={setIsCloseCycleOpen}
      />
      <OpenCycleModal
        open={isOpenCycleOpen}
        onOpenChange={setIsOpenCycleOpen}
      />
    </div>
  );
}
