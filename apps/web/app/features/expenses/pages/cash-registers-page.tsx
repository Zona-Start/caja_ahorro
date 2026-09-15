import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Heading } from '@repo/shadcn/heading';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import type { ColumnDef } from '@tanstack/react-table';
import { useState } from 'react';
import { CashRegisterForm } from '../components/cash-register-form';
import { OpenSessionForm } from '../components/open-session-form';
import {
  useActiveSession,
  useCashRegistersQuery,
  useCloseSessionMutation,
} from '../hooks/use-cash-register-queries';
import type { CashRegister } from '../schemas/cash-registers.schema';

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function CashRegistersPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { data, isLoading } = useCashRegistersQuery(filters);

  const [openCreate, setOpenCreate] = useState(false);
  const [openSessionRegister, setOpenSessionRegister] =
    useState<CashRegister | null>(null);
  const [closeSessionRegister, setCloseSessionRegister] =
    useState<CashRegister | null>(null);

  const columns: ColumnDef<CashRegister>[] = [
    { accessorKey: 'name', header: 'Nombre' },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'success' : 'destructive'}>
          {getValue<boolean>() ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenSessionRegister(row.original)}
          >
            Abrir sesión
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCloseSessionRegister(row.original)}
          >
            Corte Z
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Cajas Registradoras (POS)"
          description="Gestiona las cajas y sus sesiones de apertura/cierre"
        />
        <Button onClick={() => setOpenCreate(true)}>Nueva Caja</Button>
      </div>

      {isLoading ? (
        <DataTableSkeleton columnCount={3} rowCount={filters.limit} />
      ) : (
        <DataTable
          columns={columns}
          data={(data?.data || []) as unknown as CashRegister[]}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nueva Caja Registradora</DialogTitle>
            <DialogDescription>
              Registra una nueva caja POS para controlar el efectivo.
            </DialogDescription>
          </DialogHeader>
          <CashRegisterForm
            onSuccess={() => setOpenCreate(false)}
            onCancel={() => setOpenCreate(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!openSessionRegister}
        onOpenChange={(open) => !open && setOpenSessionRegister(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Abrir Sesión de Caja</DialogTitle>
            <DialogDescription>
              {openSessionRegister?.name} — define el fondo de caja inicial.
            </DialogDescription>
          </DialogHeader>
          {openSessionRegister && (
            <OpenSessionForm
              cashRegisterId={openSessionRegister.id}
              onSuccess={() => setOpenSessionRegister(null)}
              onCancel={() => setOpenSessionRegister(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* CORTE Z — Cierre de sesión con conteo físico */}
      <Dialog
        open={!!closeSessionRegister}
        onOpenChange={(open) => !open && setCloseSessionRegister(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Corte Z — Cierre de Sesión</DialogTitle>
            <DialogDescription>
              {closeSessionRegister?.name} — cuenta el efectivo física y
              confirma el cierre. La diferencia (sobrante/faltante) queda
              registrada.
            </DialogDescription>
          </DialogHeader>
          {closeSessionRegister && (
            <CloseSessionModalContent
              registerId={closeSessionRegister.id}
              onDone={() => setCloseSessionRegister(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CloseSessionModalContent({
  registerId,
  onDone,
}: {
  registerId: string;
  onDone: () => void;
}) {
  const closeMutation = useCloseSessionMutation();
  const { data: activeSessionData } = useActiveSession(
    registerId,
    !!registerId,
  );
  const session = activeSessionData?.data?.session;

  const [physicalCount, setPhysicalCount] = useState('');

  const expected =
    session != null ? Number(session.systemExpectedBalance ?? 0) : 0;
  const difference = Number(
    ((Number(physicalCount) || 0) - expected).toFixed(4),
  );
  const isSquare = difference === 0;

  if (!session) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-600">
        No hay una sesión abierta para esta caja POS. Abre una sesión primero.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
        <Row label="Saldo esperado (sistema)" value={toFixed2(expected)} />
      </div>
      <div>
        <span className="text-xs text-muted-foreground">
          Conteo físico de efectivo *
        </span>
        <Input
          type="number"
          step="0.01"
          min="0"
          className="mt-1 font-mono"
          value={physicalCount}
          onChange={(e) => setPhysicalCount(e.target.value)}
          placeholder="0,00"
        />
      </div>
      <div
        className={`rounded-md border p-3 text-sm ${
          isSquare
            ? 'border-[#2EA640]/30 bg-[#2EA640]/5'
            : 'border-destructive/30 bg-destructive/5'
        }`}
      >
        <div className="flex justify-between">
          <span className="font-medium">Diferencia (Corte Z)</span>
          <span
            className={`font-mono font-bold ${
              isSquare ? 'text-[#2EA640]' : 'text-destructive'
            }`}
          >
            {formatDifference(difference)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isSquare
            ? 'Caja cuadrada.'
            : difference > 0
              ? 'Sobrante en caja.'
              : 'Faltante en caja.'}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          disabled={
            !physicalCount ||
            Number(physicalCount) < 0 ||
            closeMutation.isPending
          }
          onClick={() =>
            closeMutation.mutate(
              { id: session.id, actualPhysicalBalance: Number(physicalCount) },
              { onSuccess: onDone },
            )
          }
        >
          {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}

function formatDifference(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${toFixed2(value)}`;
}
