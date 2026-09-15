import { formatCurrency } from '@/lib/format-utils';
import { useAuthStore } from '@/stores/auth.store';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Textarea } from '@repo/shadcn/textarea';
import type { ColumnDef } from '@tanstack/react-table';
import { ClipboardList, Ticket, XCircle } from 'lucide-react';
import { useState } from 'react';
import { PettyCashForm } from '../components/petty-cash-form';
import { useExpenseCategories } from '../hooks/use-expense-categories-query';
import {
  useCloseSettlementMutation,
  useCreateVoucherMutation,
  useLiquidateVoucherMutation,
  useOpenSettlementMutation,
  useSettlementsQuery,
  useVoidVoucherMutation,
  useVouchersQuery,
} from '../hooks/use-petty-cash-operations-queries';
import { usePettyCashQuery } from '../hooks/use-petty-cash-queries';
import type {
  LiquidateVoucherForm,
  Settlement,
  Voucher,
} from '../schemas/petty-cash-operations.schema';
import type { PettyCashFund } from '../schemas/petty-cash.schema';

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function PettyCashPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const { data, isLoading } = usePettyCashQuery(filters);
  const [openCreate, setOpenCreate] = useState(false);

  const columns: ColumnDef<PettyCashFund>[] = [
    { accessorKey: 'name', header: 'Nombre' },
    {
      accessorKey: 'assignedAmount',
      header: 'Monto Asignado',
      cell: ({ row, getValue }) =>
        formatCurrency(Number(getValue<string>()), row.original.currencyCode),
    },
    {
      accessorKey: 'currentBalance',
      header: 'Saldo Actual',
      cell: ({ row, getValue }) => {
        const value = getValue<number | null>();
        return value == null
          ? '-'
          : formatCurrency(value, row.original.currencyCode);
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'success' : 'destructive'}>
          {getValue<boolean>() ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Fondos Fijos / Caja Chica"
          description="Vales de caja (gastos menores), arqueo mensual y reposiciones"
        />
        {hasPermission('treasury:petty-cash', 'create') && (
          <Button onClick={() => setOpenCreate(true)}>Nuevo Fondo</Button>
        )}
      </div>

      <Tabs defaultValue="funds" className="w-full">
        <TabsList>
          <TabsTrigger value="funds">Fondos</TabsTrigger>
          <TabsTrigger value="vouchers">Vales de Caja</TabsTrigger>
          <TabsTrigger value="settlements">Arqueo Mensual</TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="space-y-4 mt-4">
          {isLoading ? (
            <DataTableSkeleton columnCount={4} rowCount={filters.limit} />
          ) : (
            <DataTable
              columns={columns}
              data={(data?.data || []) as unknown as PettyCashFund[]}
              totalItems={data?.meta?.totalCount || 0}
              pageSizeOptions={[10, 20, 30, 50]}
            />
          )}
        </TabsContent>

        <TabsContent value="vouchers" className="mt-4">
          <VouchersTab />
        </TabsContent>

        <TabsContent value="settlements" className="mt-4">
          <SettlementsTab />
        </TabsContent>
      </Tabs>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Nuevo Fondo Fijo</DialogTitle>
            <DialogDescription>
              Configura un fondo fijo administrativo para gastos menores.
            </DialogDescription>
          </DialogHeader>
          <PettyCashForm
            onSuccess={() => setOpenCreate(false)}
            onCancel={() => setOpenCreate(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────── VALES ───────────────────────────

function VouchersTab() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const voidMutation = useVoidVoucherMutation();
  const { data, isLoading } = useVouchersQuery({ page: 1, limit: 50 });
  const [openCreate, setOpenCreate] = useState(false);
  const [openLiquidate, setOpenLiquidate] = useState<Voucher | null>(null);

  const columns: ColumnDef<Voucher>[] = [
    { accessorKey: 'voucherNumber', header: 'N° Vale' },
    { accessorKey: 'beneficiaryName', header: 'Beneficiario' },
    { accessorKey: 'concept', header: 'Concepto' },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ getValue }) => formatCurrency(getValue<number>(), 'VES'),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge variant={getValue<string>() === 'OPEN' ? 'warning' : 'success'}>
          {getValue<string>() === 'OPEN' ? 'Abierto' : 'Rendido'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const voucher = row.original;
        if (voucher.status !== 'OPEN') {
          return <Badge variant="secondary">Rendido</Badge>;
        }
        return (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenLiquidate(voucher)}
            >
              Liquidar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => voidMutation.mutate(voucher.id)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-muted-foreground">
        Un vale registra la salida de efectivo del fondo al momento de entregar
        el dinero. Al presentar el ticket, se <strong>liquida</strong> y se
        convierte en gasto formal.
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setOpenCreate(true)}>
          <Ticket className="mr-2 h-4 w-4" /> Nuevo Vale
        </Button>
      </div>
      {isLoading ? (
        <DataTableSkeleton columnCount={6} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}

      <VoucherCreateModal open={openCreate} onOpenChange={setOpenCreate} />
      <VoucherLiquidateModal
        voucher={openLiquidate}
        onOpenChange={(open) => !open && setOpenLiquidate(null)}
      />
      {hasPermission('treasury:petty-cash', 'read') && null}
    </div>
  );
}

function VoucherCreateModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: fundsData } = usePettyCashQuery({ page: 1, limit: 100 });
  const createMutation = useCreateVoucherMutation();
  const [fundId, setFundId] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');

  const funds = (fundsData?.data || []) as PettyCashFund[];
  const selectedFund = funds.find((f) => f.id === fundId);
  const amountNumber = Number(amount) || 0;
  const exceedsBalance =
    selectedFund != null &&
    amountNumber > Number(selectedFund.currentBalance ?? 0);

  const submit = () => {
    createMutation.mutate(
      {
        fundId,
        beneficiaryName,
        amount: amountNumber,
        concept,
        ticketImageUrl: ticketUrl || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" /> Nuevo Vale de Caja
          </DialogTitle>
          <DialogDescription>
            Salida rápida de efectivo del fondo (adjunta el foto del ticket).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground">Fondo *</span>
            <Select value={fundId} onValueChange={setFundId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona el fondo" />
              </SelectTrigger>
              <SelectContent>
                {funds
                  .filter((f) => f.isActive)
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} (saldo {toFixed2(Number(f.currentBalance))})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">
              Beneficiario *
            </span>
            <Input
              className="mt-1"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Monto *</span>
              <Input
                type="number"
                step="0.01"
                className="mt-1 font-mono"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
              {exceedsBalance && (
                <p className="text-xs text-destructive mt-1">
                  Supera el saldo del fondo (
                  {toFixed2(Number(selectedFund!.currentBalance))})
                </p>
              )}
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                URL Foto del ticket
              </span>
              <Input
                className="mt-1"
                value={ticketUrl}
                onChange={(e) => setTicketUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Concepto *</span>
            <Textarea
              className="mt-1"
              rows={2}
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Taxí a cliente"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !fundId ||
                !beneficiaryName ||
                amountNumber <= 0 ||
                !concept ||
                exceedsBalance ||
                createMutation.isPending
              }
              onClick={submit}
            >
              {createMutation.isPending ? 'Emitiendo...' : 'Emitir Vale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VoucherLiquidateModal({
  voucher,
  onOpenChange,
}: {
  voucher: Voucher | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: categoriesData } = useExpenseCategories();
  const mutation = useLiquidateVoucherMutation();
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  const submit = () => {
    if (!voucher) return;
    mutation.mutate(
      {
        id: voucher.id,
        payload: {
          categoryId,
          description: description || undefined,
        } as LiquidateVoucherForm,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={!!voucher} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Liquidar Vale {voucher?.voucherNumber}
          </DialogTitle>
          <DialogDescription>
            El vale se convierte en gasto formal (el dinero ya salió del fondo).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between text-sm rounded-md border p-2 bg-muted/30">
            <span className="text-muted-foreground">Beneficiario</span>
            <span className="font-medium">{voucher?.beneficiaryName}</span>
          </div>
          <div className="flex justify-between text-sm rounded-md border p-2">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-mono font-semibold">
              {formatCurrency(Number(voucher?.amount ?? 0), 'VES')}
            </span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">
              Categoría de Gasto *
            </span>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecciona la categoría" />
              </SelectTrigger>
              <SelectContent>
                {(categoriesData?.data || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Descripción</span>
            <Input
              className="mt-1"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle del gasto"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!categoryId || mutation.isPending}
              onClick={submit}
            >
              {mutation.isPending ? 'Procesando...' : 'Liquidar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────── ARQUEO / RENDICIÓN ─────────────────

function SettlementsTab() {
  const obj =
    {} as import('../schemas/petty-cash-operations.schema').OpenSettlementForm;
  const { data, isLoading } = useSettlementsQuery({ page: 1, limit: 50 });
  const openMutation = useOpenSettlementMutation();

  const columns: ColumnDef<Settlement>[] = [
    { accessorKey: 'period', header: 'Período' },
    {
      accessorKey: 'openingBalance',
      header: 'Apertura',
      cell: ({ getValue }) => formatCurrency(getValue<number>(), 'VES'),
    },
    {
      accessorKey: 'expensesTotal',
      header: 'Gastos',
      cell: ({ getValue }) => formatCurrency(getValue<number>(), 'VES'),
    },
    {
      accessorKey: 'vouchersTotal',
      header: 'Vales Abiertos',
      cell: ({ getValue }) => formatCurrency(getValue<number>(), 'VES'),
    },
    {
      accessorKey: 'physicalCount',
      header: 'Conteo Físico',
      cell: ({ row }) =>
        row.original.physicalCount != null
          ? formatCurrency(row.original.physicalCount, 'VES')
          : '-',
    },
    {
      accessorKey: 'difference',
      header: 'Diferencia',
      cell: ({ row }) => {
        const value = row.original.difference;
        if (value == null) return '-';
        return (
          <span
            className={`font-mono font-medium ${
              value === 0
                ? 'text-[#2EA640]'
                : value > 0
                  ? 'text-blue-600'
                  : 'text-destructive'
            }`}
          >
            {formatCurrency(value, 'VES')}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ getValue }) => (
        <Badge
          variant={getValue<string>() === 'CLOSED' ? 'success' : 'warning'}
        >
          {getValue<string>() === 'CLOSED' ? 'Cerrado' : 'Abierta'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) =>
        row.original.status === 'OPEN' && (
          <SettlementCloseButton settlement={row.original} />
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 text-xs text-muted-foreground">
        Arqueo mensual del fondo para el cierre contable:{' '}
        <strong>Esperado</strong>= Apertura + Reposiciones − Gastos − Vales
        abiertos · <strong>Diferencia</strong> = Conteo físico − Esperado (0 =
        cuadrado).
      </div>
      <div className="flex justify-end">
        <Button
          disabled={openMutation.isPending}
          onClick={() => openMutation.mutate(obj)}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          {openMutation.isPending ? 'Procesando...' : 'Abrir Mes Actual'}
        </Button>
      </div>
      {isLoading ? (
        <DataTableSkeleton columnCount={8} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}
    </div>
  );
}

function SettlementCloseButton({ settlement }: { settlement: Settlement }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Cerrar Arqueo
      </Button>
      <SettlementCloseModal
        open={open}
        onOpenChange={setOpen}
        settlement={settlement}
      />
    </>
  );
}

function SettlementCloseModal({
  open,
  onOpenChange,
  settlement,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: Settlement;
}) {
  const closeMutation = useCloseSettlementMutation();
  const [physicalCount, setPhysicalCount] = useState('');
  const [replenishments, setReplenishments] = useState('');
  const [notes, setNotes] = useState('');

  const expected =
    settlement.openingBalance +
    (Number(replenishments) || 0) -
    settlement.expensesTotal -
    settlement.vouchersTotal;
  const difference = Number(
    ((Number(physicalCount) || 0) - expected).toFixed(4),
  );

  const isSquare = difference === 0;

  const submit = () => {
    closeMutation.mutate(
      {
        id: settlement.id,
        payload: {
          physicalCount: Number(physicalCount),
          replenishmentsTotal: Number(replenishments) || 0,
          notes: notes || undefined,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Cierre de Arqueo — Período {settlement.period}
          </DialogTitle>
          <DialogDescription>
            Ingresa el conteo físico de efectivo para calcular la diferencia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <SummaryRow
              label="Saldo de apertura"
              value={toFixed2(settlement.openingBalance)}
            />
            <SummaryRow
              label="Gastos del período"
              value={`- ${toFixed2(settlement.expensesTotal)}`}
            />
            <SummaryRow
              label="Vales abiertos (no rendidos)"
              value={`- ${toFixed2(settlement.vouchersTotal)}`}
            />
            <SummaryRow
              label="Reposiciones registradas"
              value={toFixed2(Number(replenishments) || 0)}
            />
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="font-medium">Esperado</span>
              <span className="font-mono font-bold">
                {formatCurrency(expected, 'VES')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">
                Conteo físico *
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
            <div>
              <span className="text-xs text-muted-foreground">
                Reposiciones (Bs)
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                className="mt-1 font-mono"
                value={replenishments}
                onChange={(e) => setReplenishments(e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div
            className={`rounded-md border p-3 text-sm ${
              isSquare
                ? 'border-[#2EA640]/30 bg-[#2EA640]/5'
                : 'border-destructive/30 bg-destructive/5'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">Diferencia</span>
              <span
                className={`font-mono font-bold ${
                  isSquare ? 'text-[#2EA640]' : 'text-destructive'
                }`}
              >
                {formatCurrency(difference, 'VES')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isSquare
                ? 'Caja cuadrada: el conteo coincide con el esperado.'
                : difference > 0
                  ? 'Sobrante: hay más efectivo del esperado.'
                  : 'Faltante: hay menos efectivo del esperado.'}
            </p>
          </div>

          <Textarea
            rows={2}
            placeholder="Observaciones del arqueo (opcional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={Number(physicalCount) < 0 || closeMutation.isPending}
              onClick={submit}
            >
              {closeMutation.isPending ? 'Cerrando...' : 'Cerrar Arqueo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
