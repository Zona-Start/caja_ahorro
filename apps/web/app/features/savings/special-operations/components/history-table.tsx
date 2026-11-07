'use client';

import { formatCurrency } from '@/lib/format-utils';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Eye, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import {
  useSpecialOperationDetail,
  useSpecialOperationsList,
} from '../hooks/use-special-operations';
import {
  OPERATION_LABELS,
  type SpecialOperationListItem,
} from '../schemas/special-operations.schema';

const STATUS_LABELS: Record<string, string> = {
  PROCESSING: 'Procesando',
  COMPLETED: 'Completada',
  FAILED: 'Fallida',
  CANCELLED: 'Cancelada',
};

const STATUS_VARIANTS: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'success' | 'warning'
> = {
  PROCESSING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
};

export function SpecialOperationsHistoryTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQuery = useSpecialOperationsList({
    page,
    limit: 10,
    search: search || undefined,
  });
  const detailQuery = useSpecialOperationDetail(selectedId);

  const data = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historial</h2>
          <p className="text-sm text-muted-foreground">
            Operaciones especiales ejecutadas anteriormente.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por referencia..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Referencia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Asociados</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Asiento</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {listQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            )}

            {!listQuery.isLoading && data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No hay operaciones especiales registradas.
                </TableCell>
              </TableRow>
            )}

            {data.map((operation: SpecialOperationListItem) => (
              <TableRow key={operation.id}>
                <TableCell className="font-medium">
                  {operation.reference}
                </TableCell>
                <TableCell>
                  {OPERATION_LABELS[operation.operationType]}
                </TableCell>
                <TableCell>
                  {new Date(operation.operationDate).toLocaleDateString(
                    'es-VE',
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {operation.totalAssociates}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(Number(operation.totalAmount ?? 0), 'VES')}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      STATUS_VARIANTS[operation.status] ?? 'secondary'
                    }
                  >
                    {STATUS_LABELS[operation.status] ?? operation.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {operation.voucherNo
                    ? `Nro. ${operation.voucherNo}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedId(operation.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {meta.currentPage} de {meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.currentPage >= meta.totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {detailQuery.data?.reference ?? 'Detalle de la operación'}
            </DialogTitle>
            <DialogDescription>
              {detailQuery.data
                ? `${OPERATION_LABELS[detailQuery.data.operationType as keyof typeof OPERATION_LABELS]} · ${detailQuery.data.totalAssociates} asociados`
                : 'Cargando detalle...'}
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Info
                  label="Estado"
                  value={
                    STATUS_LABELS[detailQuery.data?.status] ??
                    detailQuery.data?.status
                  }
                />
                <Info
                  label="Fecha"
                  value={detailQuery.data?.operationDate}
                />
                <Info
                  label="Total"
                  value={formatCurrency(
                    Number(detailQuery.data?.totalAmount ?? 0),
                    'VES',
                  )}
                />
                <Info
                  label="Asiento"
                  value={
                    detailQuery.data?.voucherNo
                      ? `Nro. ${detailQuery.data.voucherNo}`
                      : '—'
                  }
                />
              </div>

              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Asociado</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detailQuery.data?.items ?? []).map((item: any) => {
                      const display = item.amounts?.display ?? {};
                      const amount =
                        display.montoLiquidar ??
                        display.montoDescontar ??
                        0;

                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.cedula}</TableCell>
                          <TableCell>{item.fullname}</TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(Number(amount ?? 0), 'VES')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value ?? '—'}</p>
    </div>
  );
}
