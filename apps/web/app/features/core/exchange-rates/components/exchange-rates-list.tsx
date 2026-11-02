import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
import { Heading } from '@repo/shadcn/heading';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import {
  useExchangeRatesQuery,
  useSyncBcvMutation,
} from '../hooks/use-exchange-rates';
import { exchangeRatesColumns } from './exchange-rates-columns';
import { ExchangeRatesModal } from './exchange-rates-modal';

export default function ExchangeRatesList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, isError, error, refetch } = useExchangeRatesQuery(
    page,
    pageSize,
  );
  const { mutate: syncWithBcv, isPending: isSyncing } = useSyncBcvMutation();

  const rates = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Heading
          title="Tasas de cambio"
          description="Histórico de tasas guardadas y sincronización con el BCV"
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => syncWithBcv()}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isSyncing ? 'Sincronizando...' : 'Sincronizar con BCV'}
          </Button>

          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Cargar tasa manual
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de tasas</CardTitle>
          <CardDescription>
            Todas las tasas registradas, ordenadas de la más reciente a la más
            antigua.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <DataTableSkeleton columnCount={4} rowCount={pageSize} />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : 'No se pudieron cargar las tasas de cambio.'}
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <DataTable
              columns={exchangeRatesColumns}
              data={rates}
              totalItems={total}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </CardContent>
      </Card>

      <ExchangeRatesModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
