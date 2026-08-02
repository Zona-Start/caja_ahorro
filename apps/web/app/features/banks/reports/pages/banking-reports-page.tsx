import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { Heading } from '@repo/shadcn/heading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import { Label } from '@repo/shadcn/label';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { Skeleton } from '@repo/shadcn/skeleton';
import { Badge } from '@repo/shadcn/badge';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { useBankAccountAll } from '@/features/banks/bank-account/hooks/use-bank-account-query';
import { formatCurrency, formatDbDate } from '@/lib/format-utils';
import { bankingReportsService } from '../services/banking-reports-service';
import { useBankReconciliationsQuery } from '@/features/banks/bank-reconciliation/hooks/use-bank-reconciliation-query';
import type { BankReconciliation } from '@/features/banks/bank-reconciliation/schemas/bank-reconciliation.schema';

export default function BankingReportsPage() {
  return (
    <div className="flex flex-1 flex-col space-y-4">
      <Heading title="Reportes de Bancos" description="Reportes de conciliación, control, disponibilidad y auxiliares" />
      <Tabs defaultValue="consolidated">
        <TabsList>
          <TabsTrigger value="consolidated">Posición Consolidada</TabsTrigger>
          <TabsTrigger value="pending">Partidas Pendientes</TabsTrigger>
          <TabsTrigger value="auxiliary">Auxiliar de Bancos</TabsTrigger>
          <TabsTrigger value="act">Acta de Conciliación</TabsTrigger>
        </TabsList>

        <TabsContent value="consolidated" className="mt-4">
          <ConsolidatedPosition />
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <PendingItems />
        </TabsContent>
        <TabsContent value="auxiliary" className="mt-4">
          <AuxiliaryBook />
        </TabsContent>
        <TabsContent value="act" className="mt-4">
          <ReconciliationAct />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConsolidatedPosition() {
  const { data, isLoading } = useQuery({
    queryKey: ['banking-reports', 'consolidated'],
    queryFn: () => bankingReportsService.consolidatedPosition(),
  });

  const accounts = data?.data?.accounts || [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Posición Consolidada de Bancos</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Exportar</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => bankingReportsService.downloadConsolidatedPositionExcel()}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => bankingReportsService.downloadConsolidatedPositionPdf()}>
              <FileText className="h-4 w-4 mr-2" /> PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-32" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuenta</TableHead><TableHead>Número</TableHead><TableHead>Moneda</TableHead>
                <TableHead className="text-right">Saldo Libros</TableHead><TableHead className="text-right">Último Extracto</TableHead>
                <TableHead>Fecha Extracto</TableHead><TableHead className="text-right">Total Movs</TableHead><TableHead className="text-right">Pendientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.accountName || '-'}</TableCell>
                  <TableCell className="text-xs font-mono">{a.accountNumber}</TableCell>
                  <TableCell>{a.currencyCode}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.bookBalance, a.currencyCode)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(a.lastStatementBalance || 0, a.currencyCode)}</TableCell>
                  <TableCell className="text-xs">{formatDbDate(a.lastStatementDate)}</TableCell>
                  <TableCell className="text-right">{a.totalTransactions}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={a.pendingReconciliation > 0 ? 'warning' : 'success'}>{a.pendingReconciliation}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {accounts.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sin cuentas bancarias activas</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PendingItems() {
  const { data: accountsData } = useBankAccountAll();
  const [bankAccountId, setBankAccountId] = useState('');
  const [daysOld, setDaysOld] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['banking-reports', 'pending', bankAccountId, daysOld],
    queryFn: () => bankingReportsService.pendingItems(bankAccountId || undefined, daysOld),
    enabled: !!bankAccountId,
  });

  const items = data?.data?.items || [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Partidas Pendientes de Conciliar</CardTitle>
        <div className="flex gap-2 items-end">
          <div>
            <Label className="text-xs">Antigüedad (días)</Label>
            <Input type="number" value={daysOld} onChange={(e) => setDaysOld(Number(e.target.value))} className="w-20 h-8" />
          </div>
          {bankAccountId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => bankingReportsService.downloadPendingItemsExcel(bankAccountId, daysOld)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bankingReportsService.downloadPendingItemsPdf(bankAccountId, daysOld)}>
                  <FileText className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm">
          <Label>Cuenta Bancaria</Label>
          <SelectSearchable
            options={(accountsData?.data || []).map((a: any) => ({ value: a.id, label: `${a.accountName || ''} - ${a.accountNumber}` }))}
            onValueChange={(v) => setBankAccountId(v || '')}
            placeholder="Selecciona cuenta..."
            value={bankAccountId || undefined}
          />
        </div>
        {!bankAccountId ? (
          <p className="text-sm text-muted-foreground py-4">Selecciona una cuenta bancaria para ver las partidas pendientes.</p>
        ) : isLoading ? (
          <Skeleton className="h-32" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{items.length} partidas con más de {daysOld} días sin conciliar.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Ref</TableHead>
                  <TableHead className="text-right">Débito</TableHead><TableHead className="text-right">Crédito</TableHead><TableHead>Días</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t: any) => {
                  const age = Math.floor((Date.now() - new Date(t.transactionDate).getTime()) / 86400000);
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.internalCode}</TableCell>
                      <TableCell className="text-xs">{formatDbDate(t.transactionDate)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="text-xs">{t.bankReference || '-'}</TableCell>
                      <TableCell className="text-right">{Number(t.debitAmount) > 0 ? formatCurrency(t.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right">{Number(t.creditAmount) > 0 ? formatCurrency(t.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge variant={age > 60 ? 'destructive' : 'warning'}>{age} d</Badge></TableCell>
                    </TableRow>
                  );
                })}
                {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin partidas pendientes antiguas</TableCell></TableRow>}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AuxiliaryBook() {
  const { data: accountsData } = useBankAccountAll();
  const [bankAccountId, setBankAccountId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['banking-reports', 'auxiliary', bankAccountId, dateFrom, dateTo],
    queryFn: () => bankingReportsService.auxiliaryBook(bankAccountId, dateFrom || undefined, dateTo || undefined),
    enabled: !!bankAccountId,
  });

  const txns = data?.data?.transactions || [];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Libro Auxiliar de Bancos</CardTitle>
        <div className="flex gap-2 items-end">
          {bankAccountId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => bankingReportsService.downloadAuxiliaryBookExcel(bankAccountId, dateFrom || undefined, dateTo || undefined)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => bankingReportsService.downloadAuxiliaryBookPdf(bankAccountId, dateFrom || undefined, dateTo || undefined)}>
                  <FileText className="h-4 w-4 mr-2" /> PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Cuenta Bancaria</Label>
            <SelectSearchable
              options={(accountsData?.data || []).map((a: any) => ({ value: a.id, label: `${a.accountName || ''} - ${a.accountNumber}` }))}
              onValueChange={(v) => setBankAccountId(v || '')}
              placeholder="Selecciona cuenta..."
              value={bankAccountId || undefined}
            />
          </div>
          <div>
            <Label>Desde</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        {!bankAccountId ? (
          <p className="text-sm text-muted-foreground py-4">Selecciona una cuenta bancaria para ver el auxiliar.</p>
        ) : isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Ref</TableHead>
                <TableHead className="text-right">Débito</TableHead><TableHead className="text-right">Crédito</TableHead><TableHead>Conciliado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txns.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.internalCode}</TableCell>
                  <TableCell className="text-xs">{formatDbDate(t.transactionDate)}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{t.description}</TableCell>
                  <TableCell className="text-xs">{t.bankReference || '-'}</TableCell>
                  <TableCell className="text-right">{Number(t.debitAmount) > 0 ? formatCurrency(t.debitAmount, 'VES') : '-'}</TableCell>
                  <TableCell className="text-right">{Number(t.creditAmount) > 0 ? formatCurrency(t.creditAmount, 'VES') : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={t.reconciliationStatus === 'RECONCILED' ? 'success' : 'outline'}>
                      {t.reconciliationStatus === 'RECONCILED' ? 'Sí' : 'No'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {txns.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin movimientos en el período</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ReconciliationAct() {
  const { data: accountsData } = useBankAccountAll();
  const [bankAccountId, setBankAccountId] = useState('');
  const [selectedReconId, setSelectedReconId] = useState('');

  const { data: reconsData } = useQuery({
    queryKey: ['bank-reconciliations', 'list', { bankAccountId, limit: 50 }],
    queryFn: () => bankingReportsService.consolidatedPosition(), // fallback
    enabled: false,
  });

  // Fetch reconciliations for selected account
  const { data: reconsList } = useQuery({
    queryKey: ['banking-reports', 'recons', bankAccountId],
    queryFn: async () => {
      const r = await apiClient.get(`/bakings/bank-reconciliations?bankAccountId=${bankAccountId}`);
      return r.data;
    },
    enabled: !!bankAccountId,
  });

  const recons = reconsList?.data || [];

  const { data: actData, isLoading: actLoading } = useQuery({
    queryKey: ['banking-reports', 'act', selectedReconId],
    queryFn: () => bankingReportsService.reconciliationAct(selectedReconId),
    enabled: !!selectedReconId,
  });

  const act = actData?.data;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Acta de Conciliación Bancaria</CardTitle>
        {selectedReconId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline"><Download className="h-3 w-3 mr-1" /> Exportar</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => bankingReportsService.downloadReconciliationActExcel(selectedReconId)}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => bankingReportsService.downloadReconciliationActPdf(selectedReconId)}>
                <FileText className="h-4 w-4 mr-2" /> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Cuenta Bancaria</Label>
            <SelectSearchable
              options={(accountsData?.data || []).map((a: any) => ({ value: a.id, label: `${a.accountName || ''} - ${a.accountNumber}` }))}
              onValueChange={(v) => { setBankAccountId(v || ''); setSelectedReconId(''); }}
              placeholder="Selecciona cuenta..."
              value={bankAccountId || undefined}
            />
          </div>
          {bankAccountId && (
            <div>
              <Label>Conciliación</Label>
              <SelectSearchable
                options={recons.map((r: any) => ({ value: r.id, label: `${formatDbDate(r.statementDate)} - ${r.status}` }))}
                onValueChange={(v) => setSelectedReconId(v || '')}
                placeholder="Selecciona conciliación..."
                value={selectedReconId || undefined}
              />
            </div>
          )}
        </div>

        {!selectedReconId ? (
          <p className="text-sm text-muted-foreground py-4">Selecciona una cuenta y una conciliación para ver el acta.</p>
        ) : actLoading ? (
          <Skeleton className="h-64" />
        ) : act ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Saldo Extracto</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatCurrency(act.reconciliation?.statementEndingBalance || 0, 'VES')}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Libros (Antes)</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatCurrency(act.reconciliation?.bookBalanceBefore || 0, 'VES')}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Libros (Después)</CardTitle></CardHeader><CardContent><p className="text-lg font-bold">{formatCurrency(act.reconciliation?.bookBalanceAfter || 0, 'VES')}</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Diferencia</CardTitle></CardHeader><CardContent><p className={`text-lg font-bold ${Number(act.reconciliation?.difference) === 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(act.reconciliation?.difference || 0, 'VES')}</p></CardContent></Card>
            </div>
            <p className="text-xs text-muted-foreground">Líneas conciliadas: {act.totalReconciled} de {act.totalLines} | Transacciones: {act.matchedTransactions?.length || 0}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
