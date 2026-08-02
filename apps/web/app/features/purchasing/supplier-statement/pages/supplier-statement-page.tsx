import { useMemo, useState } from 'react';
import { Button } from '@repo/shadcn/button';
import { Badge } from '@repo/shadcn/badge';
import { Card, CardContent } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { Separator } from '@repo/shadcn/separator';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { useSuppliersAllQuery } from '@/features/purchasing/suppliers/hooks/use-suppliers-queries';
import { supplierPaymentsService } from '@/features/purchasing/supplier-payments/services/supplier-payments-service';
import { Wallet, CreditCard, AlertTriangle, Calendar, FileText, Loader2 } from 'lucide-react';

const detectDocType = (reference: string): string => {
  if (!reference) return '';
  const r = reference.toUpperCase();
  if (r.startsWith('FAC-P-')) return 'INVOICE';
  if (r.startsWith('ADV-P')) return 'ADVANCE';
  if (r.startsWith('PAG-P') || r.startsWith('TRS-P')) return 'PAYMENT';
  if (r.startsWith('NC-P') || r.startsWith('NC-')) return 'CREDIT_NOTE';
  if (r.startsWith('ND-P') || r.startsWith('ND-')) return 'DEBIT_NOTE';
  return '';
};

const DOC_LABELS: Record<string, string> = {
  INVOICE: 'Factura',
  PAYMENT: 'Pago',
  CREDIT_NOTE: 'N. Crédito',
  DEBIT_NOTE: 'N. Débito',
  ADVANCE: 'Anticipo',
};

const DOC_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  INVOICE: 'default',
  PAYMENT: 'secondary',
  CREDIT_NOTE: 'outline',
  DEBIT_NOTE: 'destructive',
  ADVANCE: 'secondary',
};

export default function SupplierStatementPage() {
  const [supplierId, setSupplierId] = useState<string>('');
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [enabled, setEnabled] = useState(true);
  const [searchRef, setSearchRef] = useState('');
  const [filterType, setFilterType] = useState('');

  const { data: suppliers = [] } = useSuppliersAllQuery();

  const queryParams = useMemo(() => ({
    supplierId: supplierId || undefined,
    startDate: startDate as string,
    endDate: endDate as string,
  }), [supplierId, startDate, endDate]);

  const { data: statement, isLoading } = useQuery({
    queryKey: ['supplier-statement-page', queryParams],
    queryFn: () => supplierPaymentsService.getAccountStatement(queryParams),
    enabled,
  });

  const handleSearch = () => setEnabled(true);

  const rawItems = statement?.items || [];
  const items = useMemo(() => {
    let filtered = rawItems;
    if (searchRef) {
      const q = searchRef.toLowerCase();
      filtered = filtered.filter((i: any) =>
        (i.reference || '').toLowerCase().includes(q) ||
        (i.description || '').toLowerCase().includes(q),
      );
    }
    if (filterType) {
      filtered = filtered.filter((i: any) => {
        const dt = i.documentType || detectDocType(i.reference);
        return dt === filterType;
      });
    }
    return filtered;
  }, [rawItems, searchRef, filterType]);
  const kpis = statement?.kpis;

  const totals = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    for (const item of items) {
      totalDebit += item.debit || 0;
      totalCredit += item.credit || 0;
    }
    return { totalDebit, totalCredit, net: totalDebit - totalCredit };
  }, [items]);

  const balanceColor = totals.net > 0 ? 'text-red-600' : totals.net < 0 ? 'text-emerald-600' : '';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Estado de Cuenta de Proveedores</h2>
        <p className="text-sm text-muted-foreground">
          Consulta el historial consolidado de movimientos por proveedor
        </p>
      </div>

      <div className="flex items-end gap-4 flex-wrap">
        <div className="space-y-1">
          <Label>Proveedor</Label>
          <Select value={supplierId || 'all'} onValueChange={(v) => { setSupplierId(v === 'all' ? '' : v); }}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Todos los proveedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {suppliers.map((s: { id: string; name: string }) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Desde</Label>
          <Input type="date" className="w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>Hasta</Label>
          <Input type="date" className="w-36" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="space-y-1">
          <Label>N° Documento</Label>
          <Input
            placeholder="Buscar referencia..."
            className="w-44"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={filterType || 'all'} onValueChange={(v) => setFilterType(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="INVOICE">Factura</SelectItem>
              <SelectItem value="PAYMENT">Pago</SelectItem>
              <SelectItem value="CREDIT_NOTE">N. Crédito</SelectItem>
              <SelectItem value="DEBIT_NOTE">N. Débito</SelectItem>
              <SelectItem value="ADVANCE">Anticipo</SelectItem>
            </SelectContent>
          </Select>
        </div>


      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {statement && (
        <>
          <div className="flex gap-3">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950 flex-1">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Deuda Actual</p>
                  <p className="text-xl font-bold text-red-700">{formatCurrency(kpis?.totalDebt ?? 0, 'VES')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950 flex-1">
              <CardContent className="p-4 flex items-center gap-3">
                <Wallet className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Saldos a Favor</p>
                  <p className="text-xl font-bold text-emerald-700">{formatCurrency(kpis?.availableCredits ?? 0, 'VES')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 flex-1">
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Monto Vencido</p>
                  <p className="text-xl font-bold text-orange-700">{formatCurrency(kpis?.overdueAmount ?? 0, 'VES')}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 flex-1">
              <CardContent className="p-4 flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Por Vencer</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(kpis?.upcomingAmount ?? 0, 'VES')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Fecha</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  {!supplierId && <TableHead>Proveedor</TableHead>}
                  <TableHead>N° Documento</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead className="text-right">Cargo (+)</TableHead>
                  <TableHead className="text-right">Abono (-)</TableHead>
                  <TableHead className="text-right">Saldo Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={supplierId ? 7 : 8} className="text-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      No se encontraron movimientos en el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item: any, i: number) => {
                    const docType = item.documentType || detectDocType(item.reference);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {item.date ? format(new Date(item.date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={DOC_VARIANTS[docType] || 'secondary'} className="text-xs">
                            {DOC_LABELS[docType] || docType || '—'}
                          </Badge>
                        </TableCell>
                        {!supplierId && (
                          <TableCell className="text-xs">{item.supplierName || '—'}</TableCell>
                        )}
                        <TableCell className="text-xs font-mono">{item.reference || '—'}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{item.description || '—'}</TableCell>
                        <TableCell className="text-right text-xs">{item.debit > 0 ? formatCurrency(item.debit, 'VES') : '-'}</TableCell>
                        <TableCell className="text-right text-xs">{item.credit > 0 ? formatCurrency(item.credit, 'VES') : '-'}</TableCell>
                        <TableCell className={`text-right text-xs font-semibold ${item.balance < 0 ? 'text-red-600' : ''}`}>
                          {formatCurrency(item.balance, 'VES')}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totales al pie */}
          {items.length > 0 && (
            <div className="flex justify-end gap-8 bg-muted/30 rounded-md px-6 py-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Cargo (+)</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(totals.totalDebit, 'VES')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Abono (-)</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(totals.totalCredit, 'VES')}</p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-lg font-extrabold ${balanceColor}`}>
                  {formatCurrency(totals.net, 'VES')}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
