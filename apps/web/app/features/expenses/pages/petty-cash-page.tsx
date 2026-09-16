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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
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
import {
  CheckCircle2,
  ClipboardList,
  HandCoins,
  MoreHorizontal,
  Printer,
  ScrollText,
  Ticket,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { PettyCashForm } from '../components/petty-cash-form';
import { useExpenseCategories } from '../hooks/use-expense-categories-query';
import { useExpenseQuery } from '../hooks/use-expense-queries';
import {
  useCreateVoucherMutation,
  useLiquidateVoucherMutation,
  usePayReplenishmentMutation,
  useRealizeSettlementMutation,
  useReplenishSettlementMutation,
  useSettlementPreviewQuery,
  useSettlementsQuery,
  useVoidVoucherMutation,
  useVouchersQuery,
} from '../hooks/use-petty-cash-operations-queries';
import { usePettyCashQuery } from '../hooks/use-petty-cash-queries';
import { EXPENSE_STATUS_OPTIONS } from '../schemas/expenses.schema';
import type {
  LiquidateVoucherForm,
  RealizeSettlementForm,
  Settlement,
  Voucher,
} from '../schemas/petty-cash-operations.schema';
import type { PettyCashFund } from '../schemas/petty-cash.schema';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('es-VE');
};

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function voucherStatusMeta(status: string): {
  label: string;
  variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';
} {
  switch (status) {
    case 'OPEN':
      return { label: 'Abierto', variant: 'warning' };
    case 'LIQUIDATED':
      return { label: 'Rendido', variant: 'success' };
    case 'SETTLED':
      return { label: 'Cerrado por Arqueo', variant: 'secondary' };
    default:
      return { label: status, variant: 'outline' };
  }
}

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
      </div>

      <Tabs defaultValue="funds" className="w-full">
        <TabsList>
          <TabsTrigger value="funds">Fondos</TabsTrigger>
          <TabsTrigger value="vouchers">Vales de Caja</TabsTrigger>
          <TabsTrigger value="settlements">Arqueo Mensual</TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="space-y-4 mt-4">
          {hasPermission('treasury:petty-cash', 'create') && (
            <div className="flex justify-end">
              <Button onClick={() => setOpenCreate(true)}>Nuevo Fondo</Button>
            </div>
          )}
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
  const [openDetails, setOpenDetails] = useState<Voucher | null>(null);

  const columns: ColumnDef<Voucher>[] = [
    { accessorKey: 'voucherNumber', header: 'N° Vale' },
    { accessorKey: 'beneficiaryName', header: 'Beneficiario' },
    { accessorKey: 'concept', header: 'Concepto' },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row, getValue }) =>
        formatCurrency(getValue<number>(), row.original.currencyCode || 'VES'),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ getValue }) => {
        const meta = voucherStatusMeta(getValue<string>());
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const voucher = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setOpenDetails(voucher)}>
                <ScrollText className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              {voucher.status === 'OPEN' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setOpenLiquidate(voucher)}>
                    <ClipboardList className="mr-2 h-4 w-4 text-[#2EA640]" />
                    Liquidar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => voidMutation.mutate(voucher.id)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Anular
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
        key={openLiquidate?.id ?? 'liquidate'}
        voucher={openLiquidate}
        onOpenChange={(open) => !open && setOpenLiquidate(null)}
      />
      <VoucherDetailsModal
        voucher={openDetails}
        onOpenChange={(open) => !open && setOpenDetails(null)}
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
  const [receiptNumber, setReceiptNumber] = useState('');

  const submit = () => {
    if (!voucher) return;
    mutation.mutate(
      {
        id: voucher.id,
        payload: {
          categoryId,
          description: description || undefined,
          receiptNumber: receiptNumber || undefined,
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
          <div>
            <span className="text-xs text-muted-foreground">
              N° de Comprobante (opcional)
            </span>
            <Input
              className="mt-1"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="Ej: 001234"
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

// ───────────────── DETALLE DEL VALE ─────────────────

function VoucherDetailsModal({
  voucher,
  onOpenChange,
}: {
  voucher: Voucher | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!voucher;
  const { data: expenseData, isLoading } = useExpenseQuery(
    voucher?.expenseId ?? '',
    open && !!voucher?.expenseId,
  );
  const expense = expenseData?.data;
  const currency = voucher?.currencyCode || 'VES';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Detalle del Vale {voucher?.voucherNumber}
          </DialogTitle>
          <DialogDescription>
            Información del vale y del gasto generado al rendirlo.
          </DialogDescription>
        </DialogHeader>

        {voucher && (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={voucherStatusMeta(voucher.status).variant}>
                {voucherStatusMeta(voucher.status).label}
              </Badge>
              {voucher.fundName && (
                <Badge variant="outline">{voucher.fundName}</Badge>
              )}
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <DetailRow label="Beneficiario" value={voucher.beneficiaryName} />
              <DetailRow label="Concepto" value={voucher.concept} />
              <DetailRow
                label="Monto"
                value={formatCurrency(Number(voucher.amount), currency)}
              />
              <DetailRow
                label="Fecha"
                value={formatDate(voucher.voucherDate)}
              />
              {voucher.liquidatedAt && (
                <DetailRow
                  label="Rendido el"
                  value={formatDate(voucher.liquidatedAt)}
                />
              )}
              {voucher.ticketImageUrl && (
                <DetailRow label="Ticket" value={voucher.ticketImageUrl} />
              )}
            </div>

            {voucher.status !== 'OPEN' && (
              <div className="rounded-lg border p-3 space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Gasto generado
                </span>
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">Cargando...</p>
                ) : expense ? (
                  <>
                    <DetailRow
                      label="Estado"
                      value={
                        EXPENSE_STATUS_OPTIONS[
                          expense.status as keyof typeof EXPENSE_STATUS_OPTIONS
                        ] ?? expense.status
                      }
                    />
                    <DetailRow
                      label="Descripción"
                      value={expense.description}
                    />
                    <DetailRow
                      label="N° Comprobante"
                      value={expense.receiptNumber || '—'}
                    />
                    <DetailRow
                      label="Total"
                      value={formatCurrency(
                        Number(expense.amountBase ?? expense.amount ?? 0),
                        currency,
                      )}
                    />
                    {expense.details && expense.details.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-xs text-muted-foreground">
                          Líneas de detalle
                        </span>
                        {expense.details.map((line, idx) => (
                          <div
                            key={line.id ?? idx}
                            className="flex justify-between gap-2 text-xs border-b last:border-0 py-1"
                          >
                            <span className="flex-1 truncate">
                              {line.categoryName || 'Sin categoría'} ·{' '}
                              {line.description}
                            </span>
                            <span className="font-mono">
                              {Number(line.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Gasto vinculado no disponible.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right truncate max-w-[300px]">{value}</span>
    </div>
  );
}

// ───────────────── ARQUEO MENSUAL ─────────────────

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const currentPeriod = () => new Date().toISOString().slice(0, 7);

const formatPeriod = (period: string) => {
  const [year, month] = period.split('-');
  const name = MONTH_NAMES_ES[Number(month) - 1] ?? month;
  return `${name} ${year}`;
};

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'destructive'
  | 'secondary'
  | 'outline';

function settlementState(settlement: Settlement): {
  label: string;
  variant: BadgeVariant;
} {
  if (settlement.status === 'OPEN')
    return { label: 'Abierto', variant: 'warning' };
  const diff = settlement.difference ?? 0;
  if (diff < 0) return { label: 'Con Faltante', variant: 'destructive' };
  if (diff > 0) return { label: 'Con Sobrante', variant: 'secondary' };
  return { label: 'Cuadrado', variant: 'success' };
}

function printSettlement(settlement: Settlement) {
  const currency = settlement.currencyCode || 'VES';
  const fmt = (v: number | null | undefined) =>
    v == null ? '—' : formatCurrency(Number(v), currency);
  const state = settlementState(settlement);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Arqueo ${settlement.period}</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:18px;margin:0 0 4px}h2{font-size:13px;color:#555;margin:0 0 16px;font-weight:normal}table{border-collapse:collapse;width:100%;max-width:520px}td{border-bottom:1px solid #ddd;padding:8px;font-size:13px}td:last-child{text-align:right;font-family:monospace}strong{font-weight:700}</style></head><body>
  <h1>Arqueo de Fondo Fijo${settlement.fundName ? ' — ' + settlement.fundName : ''}</h1>
  <h2>Período: ${formatPeriod(settlement.period)}</h2>
  <table>
    <tr><td>Estado</td><td><strong>${state.label}</strong></td></tr>
    <tr><td>Saldo de apertura</td><td>${fmt(settlement.openingBalance)}</td></tr>
    <tr><td>Gastos del período</td><td>${fmt(settlement.expensesTotal)}</td></tr>
    <tr><td>Vales abiertos</td><td>${fmt(settlement.vouchersTotal)}</td></tr>
    <tr><td>Reposiciones</td><td>${fmt(settlement.replenishmentsTotal)}</td></tr>
    <tr><td>Total esperado</td><td>${fmt(settlement.openingBalance + settlement.replenishmentsTotal - settlement.expensesTotal - settlement.vouchersTotal)}</td></tr>
    <tr><td>Conteo físico</td><td>${fmt(settlement.physicalCount)}</td></tr>
    <tr><td><strong>Diferencia</strong></td><td><strong>${fmt(settlement.difference)}</strong></td></tr>
    <tr><td>Observaciones</td><td>${settlement.notes || '—'}</td></tr>
  </table>
  <p style="font-size:11px;color:#777;margin-top:20px">Generado el ${new Date().toLocaleString('es-VE')}</p>
  </body></html>`;

  const win = window.open('', '_blank', 'width=640,height=720');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

function SettlementsTab() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const { data, isLoading } = useSettlementsQuery({ page: 1, limit: 50 });
  const [openRealize, setOpenRealize] = useState(false);
  const [details, setDetails] = useState<Settlement | null>(null);
  const replenishMutation = useReplenishSettlementMutation();
  const payReplenishMutation = usePayReplenishmentMutation();

  const money = (value: number | null | undefined, currency?: string) =>
    value == null ? '—' : formatCurrency(Number(value), currency || 'VES');

  const columns: ColumnDef<Settlement>[] = [
    {
      accessorKey: 'period',
      header: 'Período',
      cell: ({ getValue }) => formatPeriod(getValue<string>()),
    },
    {
      accessorKey: 'fundName',
      header: 'Fondo',
      cell: ({ getValue }) => getValue<string>() || '—',
    },
    {
      accessorKey: 'openingBalance',
      header: 'Apertura',
      cell: ({ row, getValue }) =>
        money(getValue<number>(), row.original.currencyCode),
    },
    {
      accessorKey: 'expensesTotal',
      header: 'Gastos',
      cell: ({ row, getValue }) =>
        money(getValue<number>(), row.original.currencyCode),
    },
    {
      accessorKey: 'vouchersTotal',
      header: 'Vales Abiertos',
      cell: ({ row, getValue }) =>
        money(getValue<number>(), row.original.currencyCode),
    },
    {
      accessorKey: 'physicalCount',
      header: 'Conteo Físico',
      cell: ({ row }) =>
        money(row.original.physicalCount, row.original.currencyCode),
    },
    {
      accessorKey: 'difference',
      header: 'Diferencia',
      cell: ({ row }) => {
        const value = row.original.difference;
        if (value == null) return '—';
        const color =
          value === 0
            ? 'text-[#2EA640]'
            : value < 0
              ? 'text-destructive'
              : 'text-blue-600';
        return (
          <span className={`font-mono font-medium ${color}`}>
            {money(value, row.original.currencyCode)}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const state = settlementState(row.original);
        return <Badge variant={state.variant}>{state.label}</Badge>;
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const s = row.original;
        const repStatus = s.replenishmentStatus ?? 'NONE';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetails(s)}>
                <ScrollText className="mr-2 h-4 w-4" />
                Ver Detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => printSettlement(s)}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir PDF
              </DropdownMenuItem>
              {s.status === 'CLOSED' && s.expensesTotal > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {repStatus === 'NONE' && (
                    <DropdownMenuItem
                      disabled={replenishMutation.isPending}
                      onClick={() => replenishMutation.mutate(s.id)}
                    >
                      <HandCoins className="mr-2 h-4 w-4 text-[#2EA640]" />
                      Generar Reposición de Efectivo
                    </DropdownMenuItem>
                  )}
                  {repStatus === 'PENDING' && (
                    <DropdownMenuItem
                      disabled={payReplenishMutation.isPending}
                      onClick={() => payReplenishMutation.mutate(s.id)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4 text-[#2EA640]" />
                      Registrar Pago de Reposición
                    </DropdownMenuItem>
                  )}
                  {repStatus === 'PAID' && (
                    <DropdownMenuItem disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-[#2EA640]" />
                      Reposición pagada
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 text-xs text-muted-foreground">
        El arqueo es una <strong>foto de control</strong> del fondo:{' '}
        <strong>Esperado</strong> = Apertura + Reposiciones − Gastos − Vales
        abiertos · <strong>Diferencia</strong> = Conteo físico − Esperado. Si la
        diferencia es negativa, el estado se marca <strong>Con Faltante</strong>
        .
      </div>

      <div className="flex justify-end">
        {hasPermission('treasury:petty-cash', 'create') && (
          <Button onClick={() => setOpenRealize(true)}>
            <ClipboardList className="mr-2 h-4 w-4" /> Realizar Arqueo
          </Button>
        )}
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

      <SettlementRealizeModal
        open={openRealize}
        onOpenChange={setOpenRealize}
      />
      <SettlementDetailsModal
        settlement={details}
        onOpenChange={(open) => !open && setDetails(null)}
      />
    </div>
  );
}

function SettlementRealizeModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: fundsData } = usePettyCashQuery({ page: 1, limit: 100 });
  const funds = (fundsData?.data || []) as PettyCashFund[];
  const realizeMutation = useRealizeSettlementMutation();

  const [fundId, setFundId] = useState('');
  const [period, setPeriod] = useState(currentPeriod());
  const [physicalCount, setPhysicalCount] = useState('');
  const [notes, setNotes] = useState('');

  const { data: preview, isFetching } = useSettlementPreviewQuery(
    fundId,
    period,
    open && !!fundId,
  );

  const currency = preview?.currencyCode || 'VES';
  const expected = preview?.expected ?? 0;
  const hasCount = physicalCount !== '' && Number(physicalCount) >= 0;
  const difference = Number(physicalCount) - expected;
  const resultState =
    difference === 0
      ? {
          label: 'Cuadrado',
          cls: 'text-[#2EA640] border-[#2EA640]/30 bg-[#2EA640]/5',
        }
      : difference < 0
        ? {
            label: 'Con Faltante',
            cls: 'text-destructive border-destructive/30 bg-destructive/5',
          }
        : {
            label: 'Con Sobrante',
            cls: 'text-blue-600 border-blue-500/30 bg-blue-500/5',
          };

  const submit = () => {
    realizeMutation.mutate(
      {
        fundId,
        period,
        physicalCount: Number(physicalCount),
        notes: notes || undefined,
      } as RealizeSettlementForm,
      {
        onSuccess: () => {
          setFundId('');
          setPeriod(currentPeriod());
          setPhysicalCount('');
          setNotes('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Realizar Arqueo
          </DialogTitle>
          <DialogDescription>
            Selecciona el fondo y el período. El sistema calcula el esperado y
            tú ingresas el conteo físico.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">
                Fondo Fijo *
              </span>
              <Select value={fundId} onValueChange={setFundId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona el fondo" />
                </SelectTrigger>
                <SelectContent>
                  {funds
                    .filter((f) => f.isActive)
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Mes / Período *
              </span>
              <Input
                type="month"
                className="mt-1"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2 text-sm bg-muted/30">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Montos calculados
            </span>
            {!fundId ? (
              <p className="text-xs text-muted-foreground">
                Selecciona un fondo para calcular los montos.
              </p>
            ) : isFetching ? (
              <p className="text-xs text-muted-foreground">Calculando...</p>
            ) : (
              <>
                <SummaryRow
                  label="Apertura"
                  value={toFixed2(preview?.openingBalance ?? 0)}
                />
                <SummaryRow
                  label="Gastos"
                  value={`- ${toFixed2(preview?.expensesTotal ?? 0)}`}
                />
                <SummaryRow
                  label="Vales abiertos"
                  value={`- ${toFixed2(preview?.vouchersTotal ?? 0)}`}
                />
                <div className="flex justify-between pt-1 border-t">
                  <span className="font-medium">Total Esperado</span>
                  <span className="font-mono font-bold">
                    {formatCurrency(expected, currency)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div>
            <span className="text-xs text-muted-foreground">
              Conteo Físico *
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 font-mono"
              placeholder="¿Cuánto efectivo hay en la caja?"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
            />
          </div>

          {hasCount && (
            <div className={`rounded-md border p-3 text-sm ${resultState.cls}`}>
              <div className="flex justify-between">
                <span className="font-medium">Diferencia</span>
                <span className="font-mono font-bold">
                  {formatCurrency(difference, currency)}
                </span>
              </div>
              <p className="text-xs mt-1">{resultState.label}</p>
            </div>
          )}

          <div>
            <span className="text-xs text-muted-foreground">
              Observación / Justificación
            </span>
            <Textarea
              className="mt-1"
              rows={2}
              placeholder="Explica cualquier diferencia o faltante"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !fundId || !period || !hasCount || realizeMutation.isPending
              }
              onClick={submit}
            >
              {realizeMutation.isPending ? 'Guardando...' : 'Guardar Arqueo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SettlementDetailsModal({
  settlement,
  onOpenChange,
}: {
  settlement: Settlement | null;
  onOpenChange: (open: boolean) => void;
}) {
  const currency = settlement?.currencyCode || 'VES';
  const state = settlement ? settlementState(settlement) : null;
  const expected = settlement
    ? settlement.openingBalance +
      settlement.replenishmentsTotal -
      settlement.expensesTotal -
      settlement.vouchersTotal
    : 0;

  return (
    <Dialog open={!!settlement} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" /> Detalle del Arqueo
          </DialogTitle>
          <DialogDescription>
            {settlement?.fundName} ·{' '}
            {settlement ? formatPeriod(settlement.period) : ''}
          </DialogDescription>
        </DialogHeader>

        {settlement && state && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-end">
              <Badge variant={state.variant}>{state.label}</Badge>
            </div>
            <div className="rounded-lg border p-3 space-y-2">
              <SummaryRow
                label="Saldo de apertura"
                value={formatCurrency(settlement.openingBalance, currency)}
              />
              <SummaryRow
                label="Gastos del período"
                value={`- ${formatCurrency(settlement.expensesTotal, currency)}`}
              />
              <SummaryRow
                label="Vales abiertos"
                value={`- ${formatCurrency(settlement.vouchersTotal, currency)}`}
              />
              <SummaryRow
                label="Reposiciones"
                value={formatCurrency(settlement.replenishmentsTotal, currency)}
              />
              <div className="flex justify-between pt-1 border-t">
                <span className="font-medium">Total Esperado</span>
                <span className="font-mono font-bold">
                  {formatCurrency(expected, currency)}
                </span>
              </div>
              <SummaryRow
                label="Conteo físico"
                value={
                  settlement.physicalCount != null
                    ? formatCurrency(settlement.physicalCount, currency)
                    : '—'
                }
              />
              <div className="flex justify-between">
                <span className="font-medium">Diferencia</span>
                <span
                  className={`font-mono font-bold ${
                    (settlement.difference ?? 0) < 0
                      ? 'text-destructive'
                      : 'text-[#2EA640]'
                  }`}
                >
                  {settlement.difference != null
                    ? formatCurrency(settlement.difference, currency)
                    : '—'}
                </span>
              </div>
              {settlement.notes && (
                <SummaryRow label="Observaciones" value={settlement.notes} />
              )}
              <SummaryRow
                label="Cerrado el"
                value={formatDate(settlement.closedAt)}
              />
            </div>

            {settlement.replenishmentStatus &&
              settlement.replenishmentStatus !== 'NONE' && (
                <div className="rounded-lg border p-3 space-y-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Reposición de Efectivo
                  </span>
                  <SummaryRow
                    label="Monto"
                    value={formatCurrency(
                      settlement.replenishmentAmount ?? 0,
                      currency,
                    )}
                  />
                  <SummaryRow
                    label="Estado"
                    value={
                      settlement.replenishmentStatus === 'PAID'
                        ? 'Pagada'
                        : 'En cola de pagos'
                    }
                  />
                  {settlement.replenishmentPaidAt && (
                    <SummaryRow
                      label="Pagada el"
                      value={formatDate(settlement.replenishmentPaidAt)}
                    />
                  )}
                </div>
              )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printSettlement(settlement)}
              >
                <Printer className="mr-1 h-4 w-4" /> Imprimir PDF
              </Button>
              <Button size="sm" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
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
