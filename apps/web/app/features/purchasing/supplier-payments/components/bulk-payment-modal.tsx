import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { Checkbox } from '@repo/shadcn/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/shadcn/dialog';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Separator } from '@repo/shadcn/separator';
import { Card, CardContent } from '@repo/shadcn/card';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import { apiClient } from '@/lib/api-client';
import { useBulkPaymentMutation } from '../hooks/use-supplier-payments-mutations';
import { useAvailableCreditsQuery } from '../hooks/use-supplier-payments-queries';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { PAYMENT_METHOD_LABELS } from '../schemas/supplier-payment-options';
import type { PendingPaymentApi, AvailableCredit } from '../schemas/supplier-payment-api.schema';
import type { BulkPaymentPayload } from '../services/supplier-payments-service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: PendingPaymentApi[];
  totalAmount: number;
  supplierId: string;
}

export function BulkPaymentModal({ open, onOpenChange, selectedItems, totalAmount, supplierId }: Props) {
  const { mutateAsync: pay, isPending } = useBulkPaymentMutation();
  const { data: availableCredits, isLoading: loadingCredits } = useAvailableCreditsQuery(supplierId, open);
  const { data: bankAccountsData } = useBankAccountAll();

  const [bankAccountId, setBankAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [description, setDescription] = useState('');
  const [bankReference, setBankReference] = useState('');
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [transactionDate, setTransactionDate] = useState(todayStr);
  const [selectedCredits, setSelectedCredits] = useState<Record<string, number>>({});
  const [manualAmount, setManualAmount] = useState<number>(totalAmount);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  // Moneda de la tasa a aplicar (el usuario elige dólar o euro) cuando la CxP es
  // en divisa. El pago siempre sale en Bs.
  const [rateCurrency, setRateCurrency] = useState<string>('USD');

  const credits = (availableCredits || []) as AvailableCredit[];

  // Si las CxP seleccionadas son en divisa, el pago sale en Bs a la tasa del día.
  const apCurrency = selectedItems[0]?.currencyCode || 'VES';
  const isForeign = apCurrency !== 'VES';

  useEffect(() => {
    if (isForeign) setRateCurrency(apCurrency);
  }, [isForeign, apCurrency]);

  useEffect(() => {
    if (!open || !isForeign) return;
    let cancelled = false;
    apiClient
      .get(`/core/exchange-rates/latest/${rateCurrency}`)
      .then((res) => {
        if (cancelled) return;
        const rate = Number(res.data?.rate);
        if (Number.isFinite(rate) && rate > 0) setExchangeRate(rate);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, isForeign, rateCurrency]);

  useEffect(() => {
    if (!open) {
      setBankAccountId('');
      setDescription('');
      setBankReference('');
      setSelectedCredits({});
    } else {
      setManualAmount(totalAmount);
    }
  }, [open, totalAmount]);

  const totalCreditApplied = useMemo(
    () => Object.values(selectedCredits).reduce((s, v) => s + v, 0),
    [selectedCredits],
  );

  const amountToPay = Math.max(0, manualAmount - totalCreditApplied);
  const totalBs = isForeign ? amountToPay * (exchangeRate || 0) : amountToPay;

  const handleAmountEdit = (value: number) => {
    const newBase = value + totalCreditApplied;
    if (newBase <= 0) return;
    setManualAmount(Math.min(newBase, totalAmount));
  };

  const formatAmountDisplay = (value: number): string => {
    if (value <= 0) return '';
    const parts = value.toFixed(2).split('.');
    const intPart = parts[0] || '0';
    const decPart = parts[1] || '00';
    const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return withDots + ',' + decPart;
  };

  const parseAmountInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      handleAmountEdit(0);
      return;
    }
    const floatVal = Number(digits) / 100;
    handleAmountEdit(floatVal);
  };

  const displayAmount = formatAmountDisplay(amountToPay);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const toggleCredit = (creditId: string, maxAvailable: number) => {
    setSelectedCredits((prev) => {
      if (prev[creditId]) {
        const { [creditId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [creditId]: Math.min(maxAvailable, totalCreditApplied + amountToPay) };
    });
  };

  const handleSubmit = async () => {
    if (!bankAccountId) return;

    const payload: BulkPaymentPayload = {
      supplierId,
      accountPayableIds: selectedItems.map((i) => i.id),
      bankAccountId,
      paymentDescription: (description || `Pago a ${selectedItems[0]?.supplierName || 'proveedor'}`) as string,
      paymentMethod: paymentMethod as string,
      transactionDate: transactionDate as string,
      totalAmount: amountToPay,
      currencyCode: apCurrency,
      exchangeRate: isForeign ? exchangeRate : 1,
      rateCurrency: isForeign ? rateCurrency : undefined,
      creditAplied: credits
        .filter((c) => (selectedCredits[c.id] ?? 0) > 0)
        .map((c) => ({
          id: c.id,
          transactionType: c.transactionType,
          appliedAmount: selectedCredits[c.id] ?? 0,
        })),
    };
    if (bankReference) payload.bankReference = bankReference;
    try {
      await pay(payload);
      onOpenChange(false);
    } catch {
      // toast shown by mutation onError
      console.log("Error al registrar el pago");
    }
  };

  const supplierName = selectedItems[0]?.supplierName || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pago</DialogTitle>
          <DialogDescription>
            Pago de {selectedItems.length} factura(s) a {supplierName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Facturas seleccionadas */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Facturas seleccionadas:</p>
              {selectedItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.reference}</span>
                  <span className="font-medium">{formatCurrency(item.amount, 'VES')}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Créditos Disponibles */}
          {loadingCredits ? (
            <div className="flex justify-center py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : credits.length > 0 ? (
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">
                  Créditos / Anticipos Disponibles del Proveedor:
                </p>
                {credits.map((credit) => {
                  const isChecked = !!selectedCredits[credit.id];
                  const maxApplicable = Math.min(credit.availableAmount, totalAmount);
                  return (
                    <div key={credit.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleCredit(credit.id, maxApplicable)}
                        id={`credit-${credit.id}`}
                      />
                      <Label htmlFor={`credit-${credit.id}`} className="flex-1 cursor-pointer truncate">
                        {credit.transactionNumber}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({credit.transactionType === 'ADVANCE' ? 'Anticipo' : 'N. Crédito'})
                        </span>
                      </Label>
                      <span className="text-muted-foreground text-xs">
                        Disponible: {formatCurrency(credit.availableAmount, 'VES')}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}

          {/* Resumen de Totales */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal Facturas:</span>
              <span>{formatCurrency(totalAmount, 'VES')}</span>
            </div>
            {totalCreditApplied > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Créditos Aplicados:</span>
                <span>- {formatCurrency(totalCreditApplied, 'VES')}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Monto a Pagar:</Label>
              <Input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                className="w-40 h-8 text-sm text-right font-mono"
                placeholder="0,00"
                value={displayAmount}
                onFocus={(e) => e.target.select()}
                onChange={(e) => parseAmountInput(e.target.value)}
              />
            </div>
            {totalCreditApplied > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Créditos Aplicados (reducen CxP):</span>
                <span>- {formatCurrency(totalCreditApplied, 'VES')}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>TOTAL POR BANCO:</span>
              <span>
                {isForeign
                  ? formatCurrency(totalBs, 'VES')
                  : formatCurrency(amountToPay, 'VES')}
              </span>
            </div>
            {isForeign && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Monto en {apCurrency}:</span>
                <span>
                  {apCurrency}{' '}
                  {amountToPay.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {/* Detalles del Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label>Banco / Cuenta</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta bancaria" />
                </SelectTrigger>
                <SelectContent>
                  {(bankAccountsData?.data || []).map((acc: { id: string; accountName: string | null; accountNumber: string }) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.accountName || acc.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            {isForeign && (
              <div className="col-span-2 grid grid-cols-2 gap-3 rounded-md border p-3">
                <div className="space-y-1">
                  <Label>Tasa a aplicar</Label>
                  <Select value={rateCurrency} onValueChange={setRateCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tasa de Cambio ({rateCurrency})</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={exchangeRate || ''}
                    onChange={(e) => setExchangeRate(Number(e.target.value) || 0)}
                    placeholder="Tasa del día de pago"
                  />
                </div>
                <p className="col-span-2 text-xs text-muted-foreground">
                  Factura {apCurrency}{' '}
                  {amountToPay.toLocaleString('es-VE', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  × tasa {rateCurrency} ={' '}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(totalBs, 'VES')}
                  </span>
                </p>
              </div>
            )}

            <div className="col-span-2 space-y-1">
              <Label>Referencia Bancaria</Label>
              <Input
                placeholder="N° de transferencia (opcional)"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending || !bankAccountId || (isForeign && exchangeRate <= 0)
            }
          >
            {isPending
              ? 'Procesando...'
              : `Pagar ${formatCurrency(totalBs, 'VES')}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
