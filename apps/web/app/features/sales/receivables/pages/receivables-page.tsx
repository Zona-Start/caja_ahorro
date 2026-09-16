import {
  useActiveSession,
  useCashRegistersAll,
} from '@/features/expenses/hooks/use-cash-register-queries';
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
import type { ColumnDef } from '@tanstack/react-table';
import { HandCoins, Search } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { useReceivables } from '../../hooks/use-sales-queries';
import { useCreatePaymentMutation } from '../../hooks/use-sales-mutations';
import type { Receivable } from '../../schemas/sales.schema';

const fmt = (value: unknown) =>
  (Number(value) || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-VE') : '—';

export default function ReceivablesPage() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );
  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState<Receivable | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const { data } = useReceivables({
    page,
    limit,
    search: search || undefined,
  });

  const columns: ColumnDef<Receivable>[] = [
    { accessorKey: 'invoiceNumber', header: 'Factura' },
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => row.original.customerName || '—',
    },
    {
      accessorKey: 'dueDate',
      header: 'Vence',
      cell: ({ row }) => formatDate(row.original.dueDate),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) => `Bs. ${fmt(row.original.totalAmount)}`,
    },
    {
      accessorKey: 'balance',
      header: 'Saldo',
      cell: ({ row }) => (
        <span className="font-semibold">Bs. {fmt(row.original.balance)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <Button size="sm" onClick={() => setSelected(row.original)}>
          <HandCoins className="mr-1 h-4 w-4" /> Cobrar
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Heading
        title="Cobros y Cuentas por Cobrar"
        description="Registra abonos de las ventas a crédito."
      />

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          className="pl-8"
          placeholder="Buscar por factura o cliente"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalItems={data?.meta.totalCount ?? 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <PaymentModal
        receivable={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function PaymentModal({
  receivable,
  onClose,
}: {
  receivable: Receivable | null;
  onClose: () => void;
}) {
  const createPayment = useCreatePaymentMutation();
  const { data: registersData } = useCashRegistersAll();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] =
    useState<'CASH' | 'CARD' | 'TRANSFER' | 'OTHER'>('CASH');
  const [cashRegisterId, setCashRegisterId] = useState('');
  const [reference, setReference] = useState('');

  const { data: activeSessionData } = useActiveSession(
    cashRegisterId,
    !!cashRegisterId && paymentMethod === 'CASH',
  );
  const session = activeSessionData?.data?.session;
  const registerOptions = (registersData?.data ?? []).filter((r) => r.isActive);

  useEffect(() => {
    if (receivable) {
      setAmount(String(receivable.balance));
      setPaymentMethod('CASH');
      setCashRegisterId('');
      setReference('');
    }
  }, [receivable]);

  if (!receivable) {
    return (
      <Dialog open={false} onOpenChange={() => undefined}>
        <DialogContent />
      </Dialog>
    );
  }

  const numericAmount = Number(amount) || 0;
  const canSubmit =
    numericAmount > 0 &&
    numericAmount <= receivable.balance &&
    !createPayment.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createPayment.mutate(
      {
        customerId: receivable.customerId ?? '',
        invoiceId: receivable.id,
        amount: numericAmount,
        paymentMethod,
        cashRegisterSessionId:
          paymentMethod === 'CASH' && session?.id ? session.id : undefined,
        referenceNumber: reference || undefined,
      },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  return (
    <Dialog open={!!receivable} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Cobrar factura</DialogTitle>
          <DialogDescription>
            {receivable.invoiceNumber} · {receivable.customerName} · Saldo Bs.{' '}
            {fmt(receivable.balance)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto</label>
            <Input
              type="number"
              step="0.01"
              min={0}
              max={receivable.balance}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Forma de pago</label>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="CARD">Punto / Tarjeta</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === 'CASH' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Caja POS</label>
              <Select value={cashRegisterId} onValueChange={setCashRegisterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una caja" />
                </SelectTrigger>
                <SelectContent>
                  {registerOptions.map((register) => (
                    <SelectItem key={register.id} value={register.id}>
                      {register.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cashRegisterId && !session && (
                <p className="text-xs text-amber-600">
                  No hay sesión de caja abierta para esta caja.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Referencia (opcional)</label>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="N° de transferencia, lote, etc."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={handleSubmit}>
              {createPayment.isPending ? 'Registrando...' : 'Registrar cobro'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
