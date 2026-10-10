'use client';

import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Checkbox } from '@repo/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { Separator } from '@repo/shadcn/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Banknote, CheckSquare, MoreHorizontal, Play } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  type ExcessItem,
  type ReimbursementListItem,
} from '../services/reimbursement-service';
import {
  useBankAccountsQuery,
  useCreateReimbursementMutation,
  useExcessesQuery,
  useReimbursementActionMutation,
  useReimbursementsQuery,
} from '../hooks/use-reimbursement-query';

const originLabel = (o: ExcessItem['originType']) =>
  o === 'LOAN' ? 'Préstamo' : o === 'CREDIT' ? 'Crédito' : 'Retiro';

const money = (n: number) =>
  n?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitado',
  APPROVED: 'Aprobado',
  PROCESSED: 'Procesado',
  DISBURSED: 'Desembolsado',
  REJECTED: 'Rechazado',
  CANCELLED: 'Anulado',
};

export default function ReimbursementPage() {
  const [cedula, setCedula] = useState('');
  const [search, setSearch] = useState('');
  const [destination, setDestination] = useState<'SAVINGS' | 'CASH'>('SAVINGS');
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const { data: excesses, isFetching } = useExcessesQuery(search, !!search);
  const { data: list } = useReimbursementsQuery({ page: 1, limit: 20 });
  const createMutation = useCreateReimbursementMutation();
  const actionMutation = useReimbursementActionMutation();

  const [disburseTarget, setDisburseTarget] =
    useState<ReimbursementListItem | null>(null);
  const [bankId, setBankId] = useState<string>('');
  const [bankReference, setBankReference] = useState('');
  const [paymentDate, setPaymentDate] = useState('');

  const { data: bankAccounts } = useBankAccountsQuery(!!disburseTarget);

  const items = excesses?.items ?? [];
  const keyOf = (i: ExcessItem) =>
    `${i.originType}|${i.originId ?? i.originReference ?? ''}`;

  const selectedItems = useMemo(
    () => items.filter((i) => selected[keyOf(i)]),
    [items, selected],
  );
  const totalSelected = selectedItems.reduce((s, i) => s + i.amount, 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected({});
      return;
    }
    const next: Record<string, boolean> = {};
    for (const i of items) next[keyOf(i)] = true;
    setSelected(next);
  };

  const handleCreate = async () => {
    if (!excesses || selectedItems.length === 0) return;
    await createMutation.mutateAsync({
      cedula: excesses.associate.cedula,
      destination,
      items: selectedItems.map((i) => ({
        originType: i.originType,
        originId: i.originId,
        originReference: i.originReference,
        amount: i.amount,
      })),
    });
    setSelected({});
    setSearch('');
    setCedula('');
  };

  const confirmDisburse = () => {
    if (!disburseTarget) return;
    actionMutation.mutate(
      {
        id: disburseTarget.id,
        action: 'disburse',
        bankId: bankId || undefined,
        transactionReference: bankReference || undefined,
        paymentDate: paymentDate || undefined,
      },
      {
        onSettled: () => {
          setDisburseTarget(null);
          setBankId('');
          setBankReference('');
          setPaymentDate('');
        },
      },
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Reintegros</h1>
        <p className="text-muted-foreground text-sm">
          Pago de saldo a favor del asociado (préstamo, crédito o retiro).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Consultar saldo a favor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cédula del asociado"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearch(cedula.trim())}
            />
            <Button onClick={() => setSearch(cedula.trim())}>
              {isFetching ? 'Buscando…' : 'Buscar'}
            </Button>
          </div>

          {excesses && (
            <>
              <div className="text-sm">
                <span className="text-muted-foreground">Asociado:</span>{' '}
                <span className="font-medium">
                  {excesses.associate.fullname} ({excesses.associate.cedula})
                </span>
              </div>

              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No hay saldo a favor pendiente.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Referencia</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((i) => (
                      <TableRow key={keyOf(i)}>
                        <TableCell>
                          <Checkbox
                            checked={!!selected[keyOf(i)]}
                            onCheckedChange={(v) =>
                              setSelected((prev) => ({
                                ...prev,
                                [keyOf(i)]: !!v,
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell>{originLabel(i.originType)}</TableCell>
                        <TableCell>{i.originReference ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono">
                          {money(i.amount)} Bs
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {items.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Seleccionado ({selectedItems.length}/{items.length})
                    </span>
                    <span className="font-mono font-semibold">
                      {money(totalSelected)} Bs
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Destino:
                    </span>
                    <Select
                      value={destination}
                      onValueChange={(v) =>
                        setDestination(v as 'SAVINGS' | 'CASH')
                      }
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAVINGS">
                          Transferir a haberes
                        </SelectItem>
                        <SelectItem value="CASH">
                          Devolución en efectivo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={
                        selectedItems.length === 0 || createMutation.isPending
                      }
                      onClick={handleCreate}
                    >
                      Generar reintegro
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de reintegros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Asociado</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(list?.data ?? []).map((r: ReimbursementListItem) => (
                <TableRow key={r.id}>
                  <TableCell>{r.customReference ?? '—'}</TableCell>
                  <TableCell>
                    {r.associateFullname ?? ''} {r.associateCedula ?? ''}
                  </TableCell>
                  <TableCell>
                    {r.destination === 'SAVINGS' ? 'Haberes' : 'Efectivo'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {money(Number(r.totalAmount))} Bs
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-8 w-8 p-0">
                          <span className="sr-only">Acciones</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {r.status === 'REQUESTED' && (
                          <DropdownMenuItem
                            onClick={() =>
                              actionMutation.mutate({
                                id: r.id,
                                action: 'approve',
                              })
                            }
                          >
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Aprobar
                          </DropdownMenuItem>
                        )}
                        {r.status === 'APPROVED' &&
                          r.destination === 'SAVINGS' && (
                            <DropdownMenuItem
                              onClick={() =>
                                actionMutation.mutate({
                                  id: r.id,
                                  action: 'process',
                                })
                              }
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Procesar
                            </DropdownMenuItem>
                          )}
                        {r.status === 'APPROVED' &&
                          r.destination === 'CASH' && (
                            <DropdownMenuItem
                              onClick={() => setDisburseTarget(r)}
                            >
                              <Banknote className="mr-2 h-4 w-4" />
                              Desembolsar
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!disburseTarget}
        onOpenChange={(o) => !o && setDisburseTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desembolsar reintegro</DialogTitle>
            <DialogDescription>
              Datos bancarios (opcionales). Si no los completa, el reintegro se
              registra sin movimiento bancario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Cuenta bancaria</Label>
              <Select value={bankId} onValueChange={setBankId}>
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {(bankAccounts ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankDirectoryName
                        ? `${b.bankDirectoryName} · `
                        : ''}
                      {b.accountName ?? b.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Referencia bancaria</Label>
              <Input
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisburseTarget(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmDisburse}
              disabled={actionMutation.isPending}
            >
              Desembolsar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
