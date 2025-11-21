'use client';

import { Button } from '@repo/shadcn/components/ui/button';
import { DataTableSearch } from '@repo/shadcn/components/ui/table/data-table-search';
import { FileLock, FileUp, TableRowsSplit } from 'lucide-react';
import { useState } from 'react';
import { useAccountingCycles } from '../../../accounting-cycles/hooks/use-query-accounting-cycle';
import { usePaginatedAccountingBalances } from '../../hooks/use-query-accounting-balance';
import { BootstrappingModal } from '../bootstrapping-modal';
import { CloseCycleModal } from '../close-cycle-modal';
import { OpenCycleModal } from '../open-cycle-modal';
import { useAccountsTableFilters } from './use-accounts-table-filters';

export function AccountingBalanceTableAction() {
  const { searchQuery, setPage, setSearchQuery } = useAccountsTableFilters();
  const [isBootstrappingOpen, setIsBootstrappingOpen] = useState(false);
  const [isCloseCycleOpen, setIsCloseCycleOpen] = useState(false);
  const [isOpenCycleOpen, setIsOpenCycleOpen] = useState(false);

  // Consultar ciclos para determinar estado de botones
  const { data: cyclesData } = useAccountingCycles();

  // Consultar balances para saber si hay datos cargados (Bootstrapping)
  // Usamos limit 1 para minimizar carga, solo nos importa el totalCount
  const { data: balancesData } = usePaginatedAccountingBalances({ limit: 1 });

  const hasOpenCycle = cyclesData?.data?.some((c) => c.status === 'OPEN');
  const hasBalances = (balancesData?.meta?.totalCount || 0) > 0;

  return (
    <div className="flex items-center justify-between mt-4 ">
      <div className="flex items-center gap-4 flex-grow">
        <DataTableSearch
          title="Buscar por código o nombre"
          searchKey={String(/^\d/.test(searchQuery))}
          searchQuery={searchQuery || ''}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
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
          disabled={!hasOpenCycle}
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
