import { useState } from 'react';
import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useWithdrawalsQuery } from '../../hooks/use-inquiry-query';
import { OVERCHARGE_MOVEMENT_TYPES } from '../../schemas/inquiry-options';
import { OverchargesTab } from '../overcharges/overcharges-tab';
import {
  MovementsViewToggle,
  type MovementsView,
} from '../overcharges/movements-view-toggle';
import { columns } from './withdrawals-tables/columns';

interface WithdrawalsTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  hasOvercharges: boolean;
}

export function WithdrawalsTab({
  id,
  page,
  setPage,
  limit,
  setLimit,
  hasOvercharges,
}: WithdrawalsTabProps) {
  const [view, setView] = useState<MovementsView>('records');
  const [overchargePage, setOverchargePage] = useState(1);
  const [overchargeLimit, setOverchargeLimit] = useState(10);

  const {
    data: withdrawalsData,
    isLoading,
    isError,
  } = useWithdrawalsQuery(id, { page, limit });

  const effectiveView: MovementsView = hasOvercharges ? view : 'records';

  return (
    <div className="space-y-4">
      {hasOvercharges && (
        <MovementsViewToggle
          value={view}
          onChange={setView}
          recordsLabel="Retiros Realizados"
        />
      )}

      {effectiveView === 'overcharges' ? (
        <OverchargesTab
          id={id}
          movementType={OVERCHARGE_MOVEMENT_TYPES.RETIROS}
          errorLabel="Error al cargar los cobros en exceso de retiros."
          page={overchargePage}
          setPage={setOverchargePage}
          limit={overchargeLimit}
          setLimit={setOverchargeLimit}
        />
      ) : isLoading ? (
        <DataTableSkeleton columnCount={6} />
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Error al cargar los retiros.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={withdrawalsData?.data || []}
          totalItems={withdrawalsData?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
          page={page}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={setLimit}
        />
      )}
    </div>
  );
}
