import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
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
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { HandCoins, Plus, ScrollText, XCircle } from 'lucide-react';
import { useState } from 'react';
import { ExpenseReportFormModal } from '../components/expense-report-form-modal';
import {
  useExpenseReportsQuery,
  usePayExpenseReportMutation,
  useReportActionMutation,
} from '../hooks/use-expense-reports-queries';
import { usePettyCashAll } from '../hooks/use-petty-cash-queries';
import {
  REPORT_STATUS_LABELS,
  type PayReportForm,
} from '../schemas/expense-reports.schema';

const STATUS_VARIANTS: Record<
  string,
  'warning' | 'success' | 'destructive' | 'secondary'
> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  PAID: 'secondary',
};

export default function ExpenseReportsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useExpenseReportsQuery({
    page: 1,
    limit: 50,
    status: statusFilter || undefined,
  });

  const columns: ColumnDef<Record<string, unknown> & { id: string }>[] = [
    { accessorKey: 'title', header: 'Reporte' },
    {
      accessorKey: 'employeeName',
      header: 'Empleado',
      cell: ({ getValue }) => getValue<string>() || '—',
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row, getValue }) =>
        formatCurrency(
          Number(getValue<string>()),
          row.original.currencyCode as 'VES',
        ),
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ getValue }) => {
        const value = getValue<string>();
        return (
          <Badge variant={STATUS_VARIANTS[value] ?? 'secondary'}>
            {REPORT_STATUS_LABELS[value as 'PENDING'] ?? value}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'paidAt',
      header: 'Pagado',
      cell: ({ getValue }) =>
        getValue<string>()
          ? new Date(getValue<string>()).toLocaleDateString('es-VE')
          : '—',
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <ReportActions row={row.original as unknown as ReportRow} />
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Rendición de Viáticos / Reembolsos"
          description="El empleado reporta sus gastos; tras aprobación pasan a la cola de pagos"
        />
        <CreateReportButton />
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-muted-foreground">
        Flujo: <strong>Pendiente</strong> → el jefe <strong>Aprobar</strong> →
        cola de pagos → <strong>Pagar</strong> desde banco o fondo fijo → gasto
        formal con el empleado como beneficiario.
      </div>

      <div className="flex gap-2 items-center">
        <span className="text-xs text-muted-foreground">Estado:</span>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            {Object.entries(REPORT_STATUS_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    </div>
  );
}

interface ReportRow {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  title: string;
}

function CreateReportButton() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [open, setOpen] = useState(false);
  if (!hasPermission('treasury:expense-reports', 'create')) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Nuevo Reporte
      </Button>
      <ExpenseReportFormModal open={open} onOpenChange={setOpen} />
    </>
  );
}

function ReportActions({ row }: { row: ReportRow }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const queryClient = useQueryClient();
  void queryClient;
  const actionMutation = useReportActionMutation();
  const payMutation = usePayExpenseReportMutation();
  const [openPay, setOpenPay] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div className="flex gap-1">
      {row.status === 'PENDING' &&
        hasPermission('treasury:expense-reports', 'approve') && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-[#2EA640] hover:text-[#2EA640]"
              onClick={() =>
                actionMutation.mutate({ id: row.id, action: 'approve' })
              }
            >
              <ScrollText className="mr-1 h-3 w-3" /> Aprobar
            </Button>
            <Button
              className="text-destructive hover:text-destructive"
              variant="ghost"
              size="icon"
              onClick={() =>
                actionMutation.mutate({
                  id: row.id,
                  action: 'reject',
                  reason: rejectReason || undefined,
                })
              }
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
        )}
      {row.status === 'APPROVED' &&
        hasPermission('treasury:expense-reports', 'approve') && (
          <Button size="sm" onClick={() => setOpenPay(true)}>
            <HandCoins className="mr-1 h-3 w-3" /> Pagado
          </Button>
        )}
      {row.status === 'PAID' && <Badge variant="secondary">Pagado</Badge>}
      {row.status === 'REJECTED' && (
        <Input
          className="h-8 w-[160px] text-xs"
          placeholder="Motivo del rechazo"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      )}
      {row.status === 'APPROVED' && (
        <PayReportModal
          open={openPay}
          onOpenChange={(o) => setOpenPay(o)}
          onConfirm={(payload) =>
            payMutation.mutate(
              { id: row.id, payload },
              { onSuccess: () => setOpenPay(false) },
            )
          }
          isPending={payMutation.isPending}
        />
      )}
    </div>
  );
}

function PayReportModal({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: PayReportForm) => void;
  isPending: boolean;
}) {
  const { data: bankData } = useBankAccountAll();
  const { data: pettyData } = usePettyCashAll();
  const [paymentSource, setPaymentSource] = useState<
    'BANK_ACCOUNT' | 'PETTY_CASH'
  >('BANK_ACCOUNT');
  const [bankAccountId, setBankAccountId] = useState('');
  const [pettyCashFundId, setPettyCashFundId] = useState('');

  const valid =
    paymentSource === 'BANK_ACCOUNT' ? bankAccountId : pettyCashFundId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5" /> Pagar Reembolso
          </DialogTitle>
          <DialogDescription>
            El pago descuenta la fuente y genera el gasto formal con el empleado
            como beneficiario.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-muted-foreground">
              Fuente de pago *
            </span>
            <Select
              value={paymentSource}
              onValueChange={(v) =>
                setPaymentSource(v as 'BANK_ACCOUNT' | 'PETTY_CASH')
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_ACCOUNT">Cuenta Bancaria</SelectItem>
                <SelectItem value="PETTY_CASH">Fondo Fijo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentSource === 'BANK_ACCOUNT' && (
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona la cuenta" />
              </SelectTrigger>
              <SelectContent>
                {(bankData?.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.accountName || a.accountNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {paymentSource === 'PETTY_CASH' && (
            <Select value={pettyCashFundId} onValueChange={setPettyCashFundId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el fondo" />
              </SelectTrigger>
              <SelectContent>
                {(pettyData?.data ?? []).map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} (saldo {Number(f.currentBalance).toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!valid || isPending}
              onClick={() =>
                onConfirm({
                  paymentSource,
                  bankAccountId,
                  pettyCashFundId,
                })
              }
            >
              {isPending ? 'Pagando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
