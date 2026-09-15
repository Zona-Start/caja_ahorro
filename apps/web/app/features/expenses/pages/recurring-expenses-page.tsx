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
import { Switch } from '@repo/shadcn/switch';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import type { ColumnDef } from '@tanstack/react-table';
import { CalendarClock, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useExpenseCategories } from '../hooks/use-expense-categories-query';
import { usePettyCashAll } from '../hooks/use-petty-cash-queries';
import {
  useDeleteRecurringMutation,
  useRecurringQuery,
  useSaveRecurringMutation,
} from '../hooks/use-recurring-queries';
import {
  FREQUENCY_OPTIONS,
  type RecurringForm,
  type RecurringTemplate,
} from '../schemas/recurring.schema';

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type FormState = Omit<RecurringForm, 'amount'> & { amount: string };

const emptyState = (row?: RecurringTemplate): FormState => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  categoryId: row?.categoryId ?? '',
  supplierId: row?.supplierId ?? '',
  amount: row ? String(row.amount) : '',
  currencyCode: row?.currencyCode ?? 'VES',
  paymentSource: row?.paymentSource ?? 'BANK_ACCOUNT',
  bankAccountId: row?.bankAccountId ?? '',
  pettyCashFundId: row?.pettyCashFundId ?? '',
  frequency: row?.frequency ?? 'MONTHLY',
  dayOfMonth: row?.dayOfMonth ?? 1,
  autoCreate: row?.autoCreate ?? true,
  isActive: row?.isActive ?? true,
});

export default function RecurringExpensesPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const { data, isLoading } = useRecurringQuery({ page: 1, limit: 50 });

  const columns: ColumnDef<RecurringTemplate>[] = [
    { accessorKey: 'name', header: 'Plantilla' },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row, getValue }) =>
        formatCurrency(Number(getValue<string>()), row.original.currencyCode),
    },
    {
      accessorKey: 'frequency',
      header: 'Frecuencia',
      cell: ({ getValue }) =>
        FREQUENCY_OPTIONS[
          getValue<'MONTHLY'>() as keyof typeof FREQUENCY_OPTIONS
        ],
    },
    {
      accessorKey: 'dayOfMonth',
      header: 'Día del Mes',
      cell: ({ getValue }) => getValue<number | null>() ?? '—',
    },
    {
      accessorKey: 'nextRunDate',
      header: 'Próxima Ejecución',
      cell: ({ getValue }) => {
        const value = getValue<string | null | undefined>();
        if (!value) return '—';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        const overdue = date.getTime() <= Date.now();
        return (
          <span
            className={`flex items-center gap-1 ${
              overdue ? 'text-amber-600 font-medium' : ''
            }`}
          >
            {overdue && <CalendarClock className="h-3 w-3" />}
            {date.toLocaleDateString('es-VE')}
          </span>
        );
      },
    },
    {
      accessorKey: 'autoCreate',
      header: 'Automatizador',
      cell: ({ getValue }) => (
        <Badge variant={getValue<boolean>() ? 'success' : 'secondary'}>
          {getValue<boolean>() ? 'Auto-genera' : 'Solo alerta'}
        </Badge>
      ),
    },
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
      cell: ({ row }) => <TemplateActions row={row.original} />,
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Heading
          title="Gastos Recurrentes"
          description="El automatizador genera el registro pendiente; solo adjuntas la factura y apruebas"
        />
        <CreateTemplateButton />
      </div>

      <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 text-xs text-muted-foreground">
        <CalendarClock className="inline h-3.5 w-3.5 mr-1 text-blue-500" />
        Todos los días a las 06:00 el sistema revisa las plantillas vencidas:
        con <strong>Auto-genera</strong> crea el gasto en estado "Pendiente de
        Aprobación"; con <strong>Solo alerta</strong> solo avanza la fecha y la
        plantilla aparece destacada hasta actualizarla.
      </div>

      {(data?.data || []).some(
        (t) =>
          t.nextRunDate && new Date(t.nextRunDate) <= new Date() && t.isActive,
      ) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Hay plantillas con ejecución vencida: se generarán en el próximo ciclo
          diario (06:00) o revisa que el programador esté activo.
        </div>
      )}

      {isLoading ? (
        <DataTableSkeleton columnCount={7} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={data?.data || []}
          totalItems={data?.meta?.totalCount || 0}
          pageSizeOptions={[10, 20, 30, 50]}
        />
      )}
      {hasPermission('treasury:recurring-expenses', 'read') && null}
    </div>
  );
}

function CreateTemplateButton() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [open, setOpen] = useState(false);
  if (!hasPermission('treasury:recurring-expenses', 'create')) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Nueva Plantilla
      </Button>
      <TemplateFormModal
        open={open}
        onOpenChange={setOpen}
        initial={undefined}
      />
    </>
  );
}

function TemplateActions({ row }: { row: RecurringTemplate }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const deleteMutation = useDeleteRecurringMutation();
  const [openEdit, setOpenEdit] = useState(false);

  if (!hasPermission('treasury:recurring-expenses', 'update')) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)}>
        Editar
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive"
        disabled={!hasPermission('treasury:recurring-expenses', 'delete')}
        onClick={() => deleteMutation.mutate(row.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <TemplateFormModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        initial={row}
      />
    </>
  );
}

function TemplateFormModal({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: RecurringTemplate | null;
}) {
  const saveMutation = useSaveRecurringMutation();
  const { data: categoriesData } = useExpenseCategories();
  const { data: bankData } = useBankAccountAll();
  const { data: pettyData } = usePettyCashAll();

  const [state, setState] = useState<FormState>(() =>
    emptyState(initial ?? undefined),
  );
  const [initialId, setInitialId] = useState<string | undefined>(initial?.id);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  const paymentSource = state.paymentSource;
  const amountNumber = Number(state.amount) || 0;

  const submit = () => {
    saveMutation.mutate(
      {
        ...state,
        id: initialId,
        amount: amountNumber,
        description: state.description || undefined,
        supplierId: state.supplierId || undefined,
        bankAccountId: state.bankAccountId || undefined,
        pettyCashFundId: state.pettyCashFundId || undefined,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {initialId ? 'Editar Plantilla' : 'Nueva Plantilla Recurrente'}
          </DialogTitle>
          <DialogDescription>
            Ej: "Alquiler Oficina" todos los 1 de cada mes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Nombre *</span>
              <Input
                className="mt-1"
                placeholder="Ej: Alquiler Oficina"
                value={state.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Monto *</span>
              <Input
                className="mt-1 font-mono"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={state.amount}
                onChange={(e) => set('amount', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">
                Categoría de Gasto *
              </span>
              <Select
                value={state.categoryId}
                onValueChange={(v) => set('categoryId', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Categoría" />
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
              <span className="text-xs text-muted-foreground">Moneda</span>
              <Select
                value={state.currencyCode}
                onValueChange={(v) =>
                  set('currencyCode', v as FormState['currencyCode'])
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VES">VES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Frecuencia</span>
              <Select
                value={state.frequency}
                onValueChange={(v) =>
                  set('frequency', v as FormState['frequency'])
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_OPTIONS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Día del mes (1-28)
              </span>
              <Input
                className="mt-1"
                type="number"
                min={1}
                max={28}
                disabled={state.frequency === 'BIWEEKLY'}
                value={state.dayOfMonth}
                onChange={(e) => set('dayOfMonth', Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Fuente de pago
              </span>
              <Select
                value={state.paymentSource}
                onValueChange={(v) =>
                  set('paymentSource', v as FormState['paymentSource'])
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries({
                    BANK_ACCOUNT: 'Cuenta Bancaria',
                    PETTY_CASH: 'Fondo Fijo',
                    CASH_REGISTER: 'Caja POS',
                  } as const).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {paymentSource === 'BANK_ACCOUNT' && (
            <div>
              <span className="text-xs text-muted-foreground">
                Cuenta bancaria *
              </span>
              <Select
                value={state.bankAccountId || 'NONE'}
                onValueChange={(v) =>
                  set('bankAccountId', v === 'NONE' ? '' : v)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin definir</SelectItem>
                  {(bankData?.data ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountName || a.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {paymentSource === 'PETTY_CASH' && (
            <div>
              <span className="text-xs text-muted-foreground">Fondo fijo</span>
              <Select
                value={state.pettyCashFundId || 'NONE'}
                onValueChange={(v) =>
                  set('pettyCashFundId', v === 'NONE' ? '' : v)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Fondo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin definir</SelectItem>
                  {(pettyData?.data ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <span className="text-xs text-muted-foreground">Descripción</span>
            <Input
              className="mt-1"
              placeholder="Ej: Pago mensual de alquiler"
              value={state.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <span className="text-sm font-medium">Auto-generar gasto</span>
              <p className="text-xs text-muted-foreground">
                {
                  'Sí = crea el gasto pendiente automáticamente. No = solo alerta.'
                }
              </p>
            </div>
            <Switch
              checked={state.autoCreate}
              onCheckedChange={(v) => set('autoCreate', v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">Plantilla activa</span>
            <Switch
              checked={state.isActive}
              onCheckedChange={(v) => set('isActive', v)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                !state.name ||
                !state.categoryId ||
                amountNumber <= 0 ||
                saveMutation.isPending
              }
              onClick={submit}
            >
              {saveMutation.isPending ? 'Guardando...' : 'Guardar Plantilla'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
