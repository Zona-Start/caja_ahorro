'use client';

import { AlertModal } from '@/components/shared/alert-modal';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Progress } from '@repo/shadcn/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Switch } from '@repo/shadcn/switch';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Landmark,
  Loader2,
  Plus,
  Receipt,
  ScrollText,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useActiveSession,
  useCashRegistersAll,
} from '../../hooks/use-cash-register-queries';
import {
  useCostCenterBudgetUsage,
  useCostCentersAll,
} from '../../hooks/use-cost-center-queries';
import { useExpenseCategories } from '../../hooks/use-expense-categories-query';
import {
  useCreateExpenseMutation,
  useExpenseConfigQuery,
  useExpenseModeQuery,
} from '../../hooks/use-expense-queries';
import { usePettyCashAll } from '../../hooks/use-petty-cash-queries';
import {
  EXPENSE_TYPE_OPTIONS,
  PAYMENT_SOURCE_OPTIONS,
  type ExpenseForm,
} from '../../schemas/expenses.schema';
import { useAuthStore } from '@/stores/auth.store';

interface ExpenseWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailLine {
  categoryId: string;
  description: string;
  amount: number;
  isExempt: boolean;
}

const EMPTY_LINE: DetailLine = {
  categoryId: '',
  description: '',
  amount: 0,
  isExempt: false,
};

const toFixed2 = (value: number) =>
  value.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function ExpenseWizardModal({
  open,
  onOpenChange,
}: ExpenseWizardModalProps) {
  const { data: modeData } = useExpenseModeQuery();
  const mode = (modeData?.data?.mode ?? 'AGILE') as 'AGILE' | 'CORPORATE';
  const isCorporate = mode === 'CORPORATE';

  const { data: configData } = useExpenseConfigQuery(open);
  const { data: categoriesData } = useExpenseCategories();
  const { data: suppliers } = useSuppliersAllQuery(open);
  const { data: registersData } = useCashRegistersAll();
  const { data: bankAccountsData } = useBankAccountAll();
  const { data: pettyCashData } = usePettyCashAll();
  const { data: costCentersData } = useCostCentersAll();

  const saveMutation = useCreateExpenseMutation();

  // ── Estado local ──
  const [type, setType] = useState<'EXPRESS' | 'FORMAL_INVOICE'>('EXPRESS');
  const [supplierId, setSupplierId] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<DetailLine[]>([{ ...EMPTY_LINE }]);
  const [currencyCode, setCurrencyCode] = useState<'VES' | 'USD' | 'EUR'>(
    'VES',
  );
  const [exchangeRate, setExchangeRate] = useState(1);
  const [vatRate, setVatRate] = useState<number | null>(null);
  const [paymentSource, setPaymentSource] = useState<
    'CASH_REGISTER' | 'BANK_ACCOUNT' | 'PETTY_CASH'
  >('CASH_REGISTER');
  const [selectedRegisterId, setSelectedRegisterId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [pettyCashFundId, setPettyCashFundId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptImageUrl, setReceiptImageUrl] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  // Al abrir la modal: fija el tipo por modo y los valores de configuración
  useEffect(() => {
    if (!open) return;
    setType(mode === 'AGILE' ? 'EXPRESS' : 'FORMAL_INVOICE');
    setPaymentSource(mode === 'AGILE' ? 'CASH_REGISTER' : 'BANK_ACCOUNT');
    const rates = configData?.data;
    if (rates?.vatRate != null) {
      setVatRate((prev) => prev ?? rates.vatRate);
    }
  }, [open, mode, configData]);

  // Cuando cambia la moneda, precarga la tasa BCV
  useEffect(() => {
    if (currencyCode === 'VES') {
      setExchangeRate(1);
      return;
    }
    const rate = configData?.data?.exchangeRates?.[currencyCode];
    if (rate != null) setExchangeRate(rate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currencyCode, open]);

  const { data: activeSessionData } = useActiveSession(
    selectedRegisterId,
    !!selectedRegisterId,
  );
  const session = activeSessionData?.data?.session;

  const { data: budgetUsage } = useCostCenterBudgetUsage(
    costCenterId,
    undefined,
    isCorporate && !!costCenterId,
  );

  // ── Cálculos automáticos en vivo ──
  const displayVatRate = vatRate ?? 0;
  const baseTotal = useMemo(
    () => lines.reduce((sum, l) => sum + (l.amount || 0), 0),
    [lines],
  );
  const ivaTotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) =>
          sum + (l.isExempt ? 0 : ((l.amount || 0) * displayVatRate) / 100),
        0,
      ),
    [lines, displayVatRate],
  );
  const grandTotal = useMemo(
    () => Number(((baseTotal + ivaTotal) * exchangeRate).toFixed(4)),
    [baseTotal, ivaTotal, exchangeRate],
  );

  const categories = categoriesData?.data ?? [];
  const registerOptions = (registersData?.data ?? []).filter((r) => r.isActive);
  const suppliersList = suppliers ?? [];
  const bankAccounts = bankAccountsData?.data ?? [];
  const pettyFunds = pettyCashData?.data ?? [];

  // ── Panel de reglas (validaciones en vivo) ──
  const rules = useMemo(() => {
    const messages: { text: string; ok: boolean }[] = [];
    let canSave = true;

    const validLines = lines.filter((l) => l.categoryId && l.amount > 0);
    if (validLines.length === 0 || !description.trim()) {
      canSave = false;
      messages.push({
        text: 'Completa la descripción y al menos una línea (categoría + monto)',
        ok: false,
      });
    } else {
      messages.push({
        text: `${validLines.length} línea(s) de detalle válida(s)`,
        ok: true,
      });
    }

    if (type === 'FORMAL_INVOICE' && !supplierId) {
      canSave = false;
      messages.push({
        text: 'Facturas formales requieren proveedor',
        ok: false,
      });
    }

    if (paymentSource === 'CASH_REGISTER') {
      if (!session) {
        canSave = false;
        messages.push({
          text: selectedRegisterId
            ? 'La caja POS no tiene sesión abierta'
            : 'Selecciona la caja POS de salida',
          ok: false,
        });
      } else if (grandTotal > Number(session.systemExpectedBalance ?? 0)) {
        canSave = false;
        messages.push({
          text: `Saldo insuficiente en caja (disponible: ${toFixed2(Number(session.systemExpectedBalance ?? 0))})`,
          ok: false,
        });
      } else {
        messages.push({
          text: `Sesión abierta · Saldo esperado: ${toFixed2(Number(session.systemExpectedBalance ?? 0))}`,
          ok: true,
        });
      }
    }
    if (paymentSource === 'BANK_ACCOUNT' && !bankAccountId) {
      canSave = false;
      messages.push({ text: 'Selecciona la cuenta bancaria', ok: false });
    }
    if (paymentSource === 'PETTY_CASH' && !pettyCashFundId) {
      canSave = false;
      messages.push({ text: 'Selecciona el fondo fijo', ok: false });
    }

    if (isCorporate) {
      if (!costCenterId) {
        canSave = false;
        messages.push({
          text: 'Centro de costo requerido (modo corporativo)',
          ok: false,
        });
      } else if (budgetUsage?.data?.budget != null) {
        const overBudget =
          budgetUsage.data.used + grandTotal > budgetUsage.data.budget;
        if (overBudget) {
          messages.push({
            text: 'Excede el presupuesto mensual: requerirá permiso de aprobación',
            ok: false,
          });
        } else {
          messages.push({
            text: `Presupuesto: ${toFixed2(budgetUsage.data.used)} / ${toFixed2(budgetUsage.data.budget)}`,
            ok: true,
          });
        }
      }
    }

    return { canSave, messages };
  }, [
    lines,
    description,
    type,
    supplierId,
    paymentSource,
    session,
    selectedRegisterId,
    bankAccountId,
    pettyCashFundId,
    isCorporate,
    grandTotal,
    budgetUsage,
    costCenterId,
  ]);

  const buildPayload = (): ExpenseForm => {
    const validLines = lines.filter((l) => l.categoryId && l.amount > 0);
    const primary = validLines[0] ?? lines[0];
    return {
      categoryId: primary?.categoryId ?? '',
      paymentSource,
      amount: grandTotal,
      description: description.trim(),
      currencyCode,
      exchangeRate,
      taxAmountBase: Number(ivaTotal.toFixed(4)),
      details: validLines.map((line) => ({
        categoryId: line.categoryId,
        description: line.description || description,
        amount: line.amount,
        taxRate: line.isExempt ? 0 : displayVatRate,
        isExempt: line.isExempt,
      })),
      supplierId: supplierId || undefined,
      costCenterId: isCorporate ? costCenterId || undefined : undefined,
      type,
      receiptNumber: receiptNumber || undefined,
      receiptImageUrl: receiptImageUrl || undefined,
      cashRegisterSessionId: session?.id,
      bankAccountId: bankAccountId || undefined,
      pettyCashFundId: pettyCashFundId || undefined,
      overrideBudget: false,
    };
  };

  const handleConfirmSubmit = () => {
    setConfirmOpen(false);
    saveMutation.mutate(buildPayload(), {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  const resetForm = () => {
    setType(mode === 'AGILE' ? 'EXPRESS' : 'FORMAL_INVOICE');
    setSupplierId('');
    setDescription('');
    setLines([{ ...EMPTY_LINE }]);
    setCurrencyCode('VES');
    setExchangeRate(1);
    setBankAccountId('');
    setPettyCashFundId('');
    setSelectedRegisterId('');
    setCostCenterId('');
    setReceiptNumber('');
    setReceiptImageUrl('');
  };

  const handleUpdateLine = (
    index: number,
    field: keyof DetailLine,
    value: DetailLine[keyof DetailLine],
  ) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? undefined : (resetForm(), onOpenChange(false)))}
    >
      <DialogContent className="sm:max-w-[1000px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Registrar Gasto
          </DialogTitle>
          <DialogDescription>
            El gasto se registra como <strong>Pendiente de Aprobación</strong>.
            Los montos se calculan automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* ── SECCIÓN AZUL: Datos del gasto ── */}
          <div className="rounded-lg border border-[#3098F2]/30 bg-[#3098F2]/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#3098F2]" />
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                Datos del Gasto
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">
                  Tipo de Gasto
                </span>
                <Select
                  value={type}
                  onValueChange={(v) =>
                    setType(v as 'EXPRESS' | 'FORMAL_INVOICE')
                  }
                >
                  <SelectTrigger className="mt-1 w-full overflow-hidden">
                    <SelectValue placeholder="Selecciona..." className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_TYPE_OPTIONS).map(([k, label]) => (
                      <SelectItem key={k} value={k} className="truncate">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Proveedor</span>
                <Select
                  value={supplierId || 'NONE'}
                  onValueChange={(v) => setSupplierId(v === 'NONE' ? '' : v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin proveedor</SelectItem>
                    {suppliersList.map((s) => (
                      <SelectItem key={String(s.id)} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                Descripción *
              </span>
              <Input
                className="mt-1"
                placeholder={
                  type === 'EXPRESS'
                    ? '¿Quién recibió el dinero y en qué se gastó?'
                    : 'Descripción de la compra'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {type === 'EXPRESS'
                  ? 'Gasto express: usa la descripción para registrar al beneficiario. Puedes vincular un proveedor en facturas formales.'
                  : 'Factura formal del proveedor registrado en Compras.'}
              </p>
            </div>
          </div>
          {/* ── SECCIÓN ÁMBAR: Desglose Fiscal ── */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                Desglose Fiscal
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-xs text-muted-foreground">Moneda</span>
                <Select
                  value={currencyCode}
                  onValueChange={(v) =>
                    setCurrencyCode(v as 'VES' | 'USD' | 'EUR')
                  }
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VES">VES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Tasa BCV</span>
                <Input
                  type="number"
                  step="0.000001"
                  min="0"
                  className="mt-1"
                  value={exchangeRate}
                  onChange={(e) =>
                    setExchangeRate(parseFloat(e.target.value) || 1)
                  }
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">IVA (%)</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="mt-1"
                  placeholder={
                    configData?.data?.vatRate != null
                      ? `Sugerido: ${configData.data.vatRate}`
                      : 'Ej: 16'
                  }
                  value={vatRate ?? ''}
                  onChange={(e) =>
                    setVatRate(
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* ── SECCIÓN GRIS: Líneas de Detalle ── */}
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase text-muted-foreground">
                  Líneas de Detalle ({lines.length})
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLines((prev) => [...prev, { ...EMPTY_LINE }])}
              >
                <Plus className="h-3 w-3" /> Añadir Línea
              </Button>
            </div>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="border rounded-md p-2 space-y-2 bg-background"
              >
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[150px]">
                    <span className="text-xs text-muted-foreground">
                      Categoría *
                    </span>
                    <Select
                      value={line.categoryId}
                      onValueChange={(v) =>
                        handleUpdateLine(idx, 'categoryId', v)
                      }
                    >
                      <SelectTrigger className="h-9 mt-1 w-full overflow-hidden">
                        <SelectValue placeholder="Selecciona..." className="truncate" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id} className="truncate">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <span className="text-xs text-muted-foreground">
                      Descripción
                    </span>
                    <Input
                      className="h-9 mt-1"
                      placeholder="Ej: Bombillos oficina"
                      value={line.description}
                      onChange={(e) =>
                        handleUpdateLine(idx, 'description', e.target.value)
                      }
                    />
                  </div>
                  <div className="w-28">
                    <span className="text-xs text-muted-foreground">Monto</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="h-9 mt-1 font-mono"
                      placeholder="0,00"
                      value={line.amount || ''}
                      onChange={(e) =>
                        handleUpdateLine(
                          idx,
                          'amount',
                          Number(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="w-[110px] text-right">
                    <span className="text-xs text-muted-foreground">
                      IVA ({displayVatRate}%)
                    </span>
                    <div className="h-9 mt-1 flex items-center justify-end text-xs font-mono">
                      {toFixed2(
                        line.isExempt
                          ? 0
                          : ((line.amount || 0) * displayVatRate) / 100,
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    onClick={() =>
                      setLines((prev) =>
                        prev.length > 1
                          ? prev.filter((_, i) => i !== idx)
                          : prev.slice(0, 1),
                      )
                    }
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={line.isExempt ?? false}
                    onCheckedChange={(v) =>
                      handleUpdateLine(idx, 'isExempt', v)
                    }
                  />
                  <span className="text-muted-foreground">Exento de IVA</span>
                </div>
              </div>
            ))}


            <div className="rounded-md border bg-background/60 p-3 text-sm space-y-1">
              <SummaryRow label="Base" value={toFixed2(baseTotal)} />
              <SummaryRow
                label={`IVA (${displayVatRate}%)`}
                value={toFixed2(ivaTotal)}
              />
              <div className="flex justify-between items-center pt-1 border-t">
                <span className="font-medium">Total {currencyCode === 'VES' ? 'Bs' : currencyCode}</span>
                <span className="font-mono font-bold text-base text-primary">
                  {toFixed2(baseTotal + ivaTotal)} {currencyCode === 'VES' ? 'Bs' : currencyCode}
                </span>
              </div>
              {exchangeRate !== 1 && (
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="font-medium">Total Bs tasa BCV del día </span>
                  <span className="font-mono font-bold text-base text-primary">
                    {toFixed2(grandTotal)} Bs
                  </span>
                </div>
              )}
              {isCorporate && (
                <p className="text-xs text-muted-foreground">
                  Retenciones de IVA ({configData?.data?.vatRate ?? 16}%) e ISLR
                  ({configData?.data?.islrRate ?? 3}%) se calculan al aprobar.
                </p>
              )}
            </div>

          </div>



          {/* ── SECCIÓN VERDE: Fuente del Dinero ── */}
          <div className="rounded-lg border border-[#2EA640]/30 bg-[#2EA640]/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-[#2EA640]" />
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                Fuente del Dinero
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PAYMENT_SOURCE_OPTIONS)
                .filter(([key]) => {
                  // Validación de permisos según la clave
                  if (key === 'CASH_REGISTER') {
                    return hasPermission("treasury:cash-registers", "read");
                  }
                  if (key === 'PETTY_CASH') {
                    return hasPermission("treasury:petty-cash", "read");
                  }
                  if (key === 'BANK_ACCOUNT') {
                    return hasPermission("banking:accounts", "read");
                  }
                  return true; // Por defecto si hubiera otra opción
                })
                .map(([key, label]) => {
                  const disabled = mode === 'AGILE' && key !== 'CASH_REGISTER';
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        setPaymentSource(key as typeof paymentSource)
                      }
                      className={`rounded-md border p-2 text-xs font-medium transition-colors ${paymentSource === key
                        ? 'border-[#2EA640] bg-[#2EA640]/10 text-[#2EA640]'
                        : 'border-border hover:bg-muted'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      {label}
                    </button>
                  );
                })}
            </div>

            {paymentSource === 'CASH_REGISTER' && (
              <div className="space-y-2">
                <Select
                  value={selectedRegisterId || ''}
                  onValueChange={setSelectedRegisterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la caja POS" />
                  </SelectTrigger>
                  <SelectContent>
                    {registerOptions.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRegisterId &&
                  (session ? (
                    <p className="text-xs text-[#2EA640] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Sesión abierta · Saldo esperado:{' '}
                      <strong>
                        {toFixed2(Number(session.systemExpectedBalance))}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      No hay sesión de caja abierta para esta caja POS
                    </p>
                  ))}
              </div>
            )}

            {paymentSource === 'BANK_ACCOUNT' && (
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la cuenta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountName || a.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {paymentSource === 'PETTY_CASH' && (
              <Select
                value={pettyCashFundId}
                onValueChange={setPettyCashFundId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el fondo fijo" />
                </SelectTrigger>
                <SelectContent>
                  {pettyFunds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} (saldo {toFixed2(Number(f.currentBalance))})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ── SECCIÓN INDIGO: Centro de Costo (corporativo) ── */}
          {isCorporate && (
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-semibold uppercase text-muted-foreground">
                  Centro de Costo
                </span>
              </div>
              <Select value={costCenterId} onValueChange={setCostCenterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el centro de costo" />
                </SelectTrigger>
                <SelectContent>
                  {(costCentersData?.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {budgetUsage?.data != null && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Presupuesto mensual
                    </span>
                    <span className="font-mono">
                      {budgetUsage.data.budget != null
                        ? `${toFixed2(budgetUsage.data.used)} / ${toFixed2(budgetUsage.data.budget)}`
                        : 'Sin presupuesto definido'}
                    </span>
                  </div>
                  {budgetUsage.data.budget != null && (
                    <>
                      <Progress
                        value={Math.min(budgetUsage.data.percentage ?? 0, 100)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {budgetUsage.data.percentage ?? 0}% consumido este mes
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SECCIÓN GRIS: Comprobante ── */}
          <div className="rounded-lg border p-4 bg-muted/30 grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground">
                N° de Comprobante
              </span>
              <Input
                className="mt-1"
                placeholder="Ej: 001234"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
            </div>
            <div>
              <span className="text-xs text-muted-foreground">
                URL imagen / PDF
              </span>
              <Input
                className="mt-1"
                placeholder="https://..."
                value={receiptImageUrl}
                onChange={(e) => setReceiptImageUrl(e.target.value)}
              />
            </div>
          </div>

          {/* ── PANEL DE REGLAS ── */}
          <div
            className={`rounded-lg border p-3 ${rules.canSave
              ? 'border-[#2EA640]/30 bg-[#2EA640]/5'
              : 'border-destructive/30 bg-destructive/5'
              }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {rules.canSave ? (
                <CheckCircle2 className="h-4 w-4 text-[#2EA640]" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-semibold uppercase text-muted-foreground">
                {rules.canSave ? 'Validaciones OK' : 'Validaciones Pendientes'}
              </span>
            </div>
            <ul className="space-y-1">
              {rules.messages.map((msg, i) => (
                <li
                  key={i}
                  className={`text-xs flex items-center gap-1.5 ${msg.ok ? 'text-[#2EA640]' : 'text-destructive'
                    }`}
                >
                  {msg.ok ? (
                    <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-3 w-3 flex-shrink-0" />
                  )}
                  {msg.text}
                </li>
              ))}
            </ul>
          </div>

          {/* ── FOOTER ── */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <span className="text-xs text-muted-foreground">Total</span>
              <p className="text-xl font-black text-primary">
                {toFixed2(baseTotal + ivaTotal)} {currencyCode === 'VES' ? 'Bs' : currencyCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => (resetForm(), onOpenChange(false))}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!rules.canSave || saveMutation.isPending}
                onClick={() => setConfirmOpen(true)}
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />{' '}
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Registrar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <AlertModal
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmSubmit}
          loading={saveMutation.isPending}
          title="Confirmar Gasto"
          description="El gasto quedará PENDIENTE DE APROBACIÓN hasta que quien tenga el permiso lo apruebe y descontar el saldo."
        />
      </DialogContent>
    </Dialog>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
