import { useState } from 'react';
import { Card, CardContent } from '@repo/shadcn/card';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useCreditsQuery } from '../../hooks/use-inquiry-query';
import { OVERCHARGE_MOVEMENT_TYPES } from '../../schemas/inquiry-options';
import { OverchargesTab } from '../overcharges/overcharges-tab';
import {
  MovementsViewToggle,
  type MovementsView,
} from '../overcharges/movements-view-toggle';
import { columns } from './credits-tables/columns';

interface CreditsTabProps {
  id: string;
  page: number;
  setPage: (page: number) => void;
  limit: number;
  setLimit: (limit: number) => void;
  hasOvercharges: boolean;
}

export function CreditsTab({
  id,
  page,
  setPage,
  limit,
  setLimit,
  hasOvercharges,
}: CreditsTabProps) {
  const [view, setView] = useState<MovementsView>('records');
  const [overchargePage, setOverchargePage] = useState(1);
  const [overchargeLimit, setOverchargeLimit] = useState(10);

  const {
    data: creditsData,
    isLoading,
    isError,
  } = useCreditsQuery(id, { page, limit });

  const effectiveView: MovementsView = hasOvercharges ? view : 'records';

  return (
    <div className="space-y-4">
      {hasOvercharges && (
        <MovementsViewToggle
          value={view}
          onChange={setView}
          recordsLabel="Créditos Activos / Pagados"
        />
      )}

      {effectiveView === 'overcharges' ? (
        <OverchargesTab
          id={id}
          movementType={OVERCHARGE_MOVEMENT_TYPES.CREDITOS}
          errorLabel="Error al cargar los cobros en exceso de créditos."
          page={overchargePage}
          setPage={setOverchargePage}
          limit={overchargeLimit}
          setLimit={setOverchargeLimit}
        />
      ) : isLoading ? (
        <DataTableSkeleton columnCount={7} />
      ) : isError ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive">
            Error al cargar los créditos.
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={creditsData?.data || []}
          totalItems={creditsData?.meta?.totalCount || 0}
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
