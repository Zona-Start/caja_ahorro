import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { cn } from '@repo/shadcn/lib/utils';
import { FileLock, FileUp, Search, TableRowsSplit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: cyclesData } = useAccountingCycles();
  const { data: balancesData } = usePaginatedAccountingBalances({ limit: 1 });

  const hasOpenCycle = cyclesData?.some((c: any) => c.status === 'OPEN');
  const hasBalances = (balancesData?.meta?.totalCount || 0) > 0;

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters({ search: value || undefined, page: 1 });
    }, 400);
  };

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <div className="relative w-72 md:max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o nombre..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
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
