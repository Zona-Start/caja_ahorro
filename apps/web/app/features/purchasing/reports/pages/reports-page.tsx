import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/shadcn/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { formatCurrency } from '@/lib/format-utils';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Loader2, AlertTriangle, FileDown, FileText, Download } from 'lucide-react';

const BASE_XLSX = '/administration/supplier-transactions/reports/download/xlsx';
const BASE_PDF = '/reports/purchasing';

async function downloadFile(url: string, filename: string) {
  const res = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data]);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const NAME_MAP: Record<string, string> = {
  aging: 'antiguedad_deuda',
  'tax-book': 'libro_compras_fiscal',
  'cash-flow': 'flujo_caja_saliente',
};

function ExportDropdown({ type, params }: { type: string; params: Record<string, string> }) {
  const q = new URLSearchParams(params).toString();
  const qs = q ? `?${q}` : '';
  const today = new Date().toISOString().split('T')[0];
  const name = NAME_MAP[type] || type;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-1 h-4 w-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => downloadFile(`${BASE_XLSX}?type=${type}${q ? '&' + q : ''}`, `${name}_${today}.xlsx`)}>
          <FileDown className="mr-2 h-4 w-4" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadFile(`${BASE_PDF}/${type}/pdf${qs}`, `${name}_${today}.pdf`)}>
          <FileText className="mr-2 h-4 w-4" />
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes de Compras</h2>
        <p className="text-sm text-muted-foreground">
          Análisis financiero y fiscal de cuentas por pagar
        </p>
      </div>

      <Tabs defaultValue="aging" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="aging">Antigüedad de Deuda</TabsTrigger>
          <TabsTrigger value="tax-book">Libro de Compras Fiscal</TabsTrigger>
          <TabsTrigger value="cash-flow">Flujo de Caja Saliente</TabsTrigger>
        </TabsList>
        <TabsContent value="aging"><AgingReport /></TabsContent>
        <TabsContent value="tax-book"><TaxBookReport /></TabsContent>
        <TabsContent value="cash-flow"><CashFlowReport /></TabsContent>
      </Tabs>
    </div>
  );
}

function AgingReport() {
  const today = new Date();
  const [startDate, setStartDate] = useState(`${today.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [enabled, setEnabled] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'aging'],
    queryFn: async () => {
      const res = await apiClient.get('/administration/supplier-transactions/reports/aging');
      return res.data.data as any[];
    },
    enabled,
  });

  const items = data || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.totalDue || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-4">
          <div className="space-y-1"><Label>Desde</Label><Input type="date" className="w-36" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEnabled(false); }} /></div>
          <div className="space-y-1"><Label>Hasta</Label><Input type="date" className="w-36" value={endDate} onChange={(e) => { setEndDate(e.target.value); setEnabled(false); }} /></div>
          <Button onClick={() => setEnabled(true)}>Consultar</Button>
        </div>
        <ExportDropdown type="aging" params={{}} />
      </div>

      {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8" />}
      {!isLoading && enabled && (
        <>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <CardContent className="p-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold dark:text-red-200">Deuda Total: {formatCurrency(total, 'VES')}</span>
            </CardContent></Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead><TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Por Vencer</TableHead><TableHead className="text-right">1-30 Días</TableHead>
                  <TableHead className="text-right">31-60 Días</TableHead><TableHead className="text-right">61-90 Días</TableHead>
                  <TableHead className="text-right">+90 Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                ) : items.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{r.supplierName}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{formatCurrency(r.totalDue, 'VES')}</TableCell>
                    <TableCell className="text-right text-xs">{r.bucket0 > 0 ? formatCurrency(r.bucket0, 'VES') : '-'}</TableCell>
                    <TableCell className="text-right text-xs">{r.bucket1to30 > 0 ? formatCurrency(r.bucket1to30, 'VES') : '-'}</TableCell>
                    <TableCell className="text-right text-xs">{r.bucket31to60 > 0 ? formatCurrency(r.bucket31to60, 'VES') : '-'}</TableCell>
                    <TableCell className="text-right text-xs">{r.bucket61to90 > 0 ? formatCurrency(r.bucket61to90, 'VES') : '-'}</TableCell>
                    <TableCell className="text-right text-xs text-red-600 font-medium">{r.bucket90plus > 0 ? formatCurrency(r.bucket90plus, 'VES') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function TaxBookReport() {
  const today = new Date();
  const [startDate, setStartDate] = useState(`${today.getFullYear()}-01-01`);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [enabled, setEnabled] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'tax-book', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get('/administration/supplier-transactions/reports/tax-book', { params: { startDate, endDate } });
      return res.data.data as any[];
    },
    enabled,
  });

  const items = data || [];
  const totalBase = items.reduce((s: number, i: any) => s + Number(i.subtotal || 0), 0);
  const totalIva = items.reduce((s: number, i: any) => s + Number(i.taxAmount || 0), 0);
  const totalGen = items.reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-end gap-4">
          <div className="space-y-1"><Label>Desde</Label><Input type="date" className="w-36" value={startDate} onChange={(e) => { setStartDate(e.target.value); setEnabled(false); }} /></div>
          <div className="space-y-1"><Label>Hasta</Label><Input type="date" className="w-36" value={endDate} onChange={(e) => { setEndDate(e.target.value); setEnabled(false); }} /></div>
          <Button onClick={() => setEnabled(true)}>Consultar</Button>
        </div>
        <ExportDropdown type="tax-book" params={{ startDate: startDate as string, endDate: endDate as string }} />
      </div>

      {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8" />}
      {enabled && !isLoading && (
        <>
          <div className="flex gap-4 text-xs bg-muted/30 p-3 rounded-md">
            <span>Base: <strong>{formatCurrency(totalBase, 'VES')}</strong></span>
            <span>IVA: <strong>{formatCurrency(totalIva, 'VES')}</strong></span>
            <span>Total: <strong>{formatCurrency(totalGen, 'VES')}</strong></span>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead><TableHead>RIF</TableHead><TableHead>Proveedor</TableHead>
                  <TableHead>N° Factura</TableHead><TableHead>N° Control</TableHead>
                  <TableHead className="text-right">Base Imponible</TableHead>
                  <TableHead className="text-right">IVA</TableHead><TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
                ) : items.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs whitespace-nowrap">{r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '-'}</TableCell>
                    <TableCell className="text-xs">{r.supplierTaxId || '—'}</TableCell>
                    <TableCell className="text-xs">{r.supplierName}</TableCell>
                    <TableCell className="text-xs font-mono">{r.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{r.controlNumber || '—'}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(r.subtotal, 'VES')}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(r.taxAmount, 'VES')}</TableCell>
                    <TableCell className="text-right text-xs font-medium">{formatCurrency(r.totalAmount, 'VES')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function CashFlowReport() {
  const [groupBy, setGroupBy] = useState<'week' | 'month'>('month');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'cash-flow', groupBy],
    queryFn: async () => {
      const res = await apiClient.get('/administration/supplier-transactions/reports/cash-flow', { params: { groupBy } });
      return res.data.data as any[];
    },
  });

  const items = data || [];
  const total = items.reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0);

  const formatPeriod = (d: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (groupBy === 'week') {
      const end = new Date(date);
      end.setDate(end.getDate() + 6);
      return `Sem ${format(date, 'w')}: ${format(date, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
    }
    return format(date, 'MMMM yyyy');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Label>Agrupar por:</Label>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'week' | 'month')}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="month">Mes</SelectItem><SelectItem value="week">Semana</SelectItem></SelectContent>
          </Select>
        </div>
        <ExportDropdown type="cash-flow" params={{ groupBy }} />
      </div>

      {isLoading && <Loader2 className="h-6 w-6 animate-spin mx-auto mt-8" />}
      {!isLoading && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Cantidad CxP</TableHead>
                <TableHead className="text-right">Total a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sin datos</TableCell></TableRow>
              ) : (
                <>
                  {items.map((r: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{formatPeriod(r.period)}</TableCell>
                      <TableCell className="text-right text-xs">{r.count}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{formatCurrency(r.totalAmount, 'VES')}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-bold">
                    <TableCell className="text-xs">TOTAL</TableCell>
                    <TableCell className="text-right text-xs">{items.reduce((s: number, i: any) => s + Number(i.count || 0), 0)}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(total, 'VES')}</TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
