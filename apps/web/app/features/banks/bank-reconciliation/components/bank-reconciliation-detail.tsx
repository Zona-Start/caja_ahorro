import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/shadcn/table';
import { Skeleton } from '@repo/shadcn/skeleton';
import {
  ArrowLeft, CheckCircle, Plus, FileSpreadsheet, Banknote, BookOpen,
  Wand2, Repeat, BookPlus, X,
} from 'lucide-react';
import { formatCurrency, formatDbDate } from '@/lib/format-utils';
import {
  useBankReconciliationQuery, useProcessReconciliationMutation, useCancelReconciliationMutation,
  useAddStatementLineMutation, useAutoMatchMutation, useManualMatchMutation,
  useGenerateBookEntryMutation, useUnmatchLineMutation, useStatementLinesQuery, useBookTransactionsQuery,
} from '../hooks/use-bank-reconciliation-query';
import { RECONCILIATION_STATUS_OPTIONS } from '../schemas/bank-reconciliation-options';
import { BankReconciliationUploadModal } from './bank-reconciliation-upload';
import { AddStatementLineForm } from './add-statement-line-form';
import { GenerateBookEntryModal } from './generate-book-entry-modal';
import { AlertModal } from '@/components/shared/alert-modal';
import { Checkbox } from '@repo/shadcn/checkbox';
import { useToastSystem } from '@/hooks/use-toast-system';

export function BankReconciliationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: toastError } = useToastSystem();

  const { data: reconData, isLoading } = useBankReconciliationQuery(id!, !!id);
  const { data: linesData } = useStatementLinesQuery(id!, !!id);
  const { data: booksData } = useBookTransactionsQuery(id!, !!id);

  const processMutation = useProcessReconciliationMutation();
  const cancelMutation = useCancelReconciliationMutation();
  const autoMatchMutation = useAutoMatchMutation();
  const manualMatchMutation = useManualMatchMutation();
  const lineMutation = useAddStatementLineMutation();
  const generateMutation = useGenerateBookEntryMutation();
  const unmatchMutation = useUnmatchLineMutation();

  const [showUpload, setShowUpload] = useState(false);
  const [showAddLine, setShowAddLine] = useState(false);
  const [generateModalId, setGenerateModalId] = useState<string | null>(null);
  const [unmatchConfirmLineId, setUnmatchConfirmLineId] = useState<string | null>(null);
  const [selectedStmtIds, setSelectedStmtIds] = useState<Set<string>>(new Set());
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

  const reconciliation = reconData?.data;
  const statementLines = linesData?.data || [];
  const bookTransactions = booksData?.data || [];

  const isInProgress = reconciliation?.status === 'IN_PROGRESS';
  const isCompleted = reconciliation?.status === 'COMPLETED';

  const stmtDate = reconciliation?.statementDate ? new Date(reconciliation.statementDate) : null;
  const startDate = reconciliation?.startDate ? new Date(reconciliation.startDate) : null;

  // Build set of matched book transaction IDs from reconciliation details
  const matchedBookIds = useMemo(() => {
    const details = reconciliation?.details || [];
    return new Set(details.map((d: any) => d.bankTransactionId).filter(Boolean));
  }, [reconciliation?.details]);

  const statementBalance = Number(reconciliation?.statementEndingBalance ?? 0);
  const bookBalanceBefore = Number(reconciliation?.bookBalanceBefore ?? 0);

  const reconciledStmtLines = statementLines.filter((l: any) => l.status === 'RECONCILED');
  const matchedStmtLines = statementLines.filter((l: any) => l.status === 'MATCHED');
  const pendingStmtLines = statementLines.filter((l: any) => l.status === 'PENDING');
  const reconciledBooks = bookTransactions.filter((b: any) => b.reconciliationStatus === 'RECONCILED');
  const matchedBooks = bookTransactions.filter((b: any) => matchedBookIds.has(b.id) && b.reconciliationStatus !== 'RECONCILED');
  const pendingBooks = bookTransactions.filter((b: any) => !matchedBookIds.has(b.id) && b.reconciliationStatus !== 'RECONCILED');

  // Books generated during this session via "Contabilizar" (have bankReconciliationId set)
  const newBooksGenerated = bookTransactions.filter((b: any) => b.bankReconciliationId === id);

  // ── KPIs ──
  // 1. Saldo Extracto = static
  // 2. Libros (Antes) = bookBalanceBefore from DB
  // 3. Movs. Conciliados = net of all MATCHED + RECONCILED statement lines
  // 4. Libros (Después) = Libros (Antes) + net of NEW book txns generated via Contabilizar
  // 5. Diferencia = Saldo Extracto - Libros (Después)

  const movimientosConciliados = useMemo(() => {
    const matchedAndReconciled = [...matchedStmtLines, ...reconciledStmtLines];
    return matchedAndReconciled.reduce((s: number, l: any) => s + Number(l.creditAmount) - Number(l.debitAmount), 0);
  }, [matchedStmtLines, reconciledStmtLines]);

  const librosDespues = useMemo(() => {
    const netGenerated = newBooksGenerated.reduce((s: number, b: any) => s + Number(b.creditAmount) - Number(b.debitAmount), 0);
    return bookBalanceBefore + netGenerated;
  }, [bookBalanceBefore, newBooksGenerated]);

  const diferencia = useMemo(() => {
    return statementBalance - librosDespues;
  }, [statementBalance, librosDespues]);

  const diferenciaCuadra = Math.abs(diferencia) < 0.01;

  const selectedStmtTotal = useMemo(() => {
    return statementLines
      .filter((l: any) => selectedStmtIds.has(l.id))
      .reduce((s: number, l: any) => s + Number(l.creditAmount) - Number(l.debitAmount), 0);
  }, [statementLines, selectedStmtIds]);

  const selectedBooksTotal = useMemo(() => {
    return bookTransactions
      .filter((b: any) => selectedBookIds.has(b.id))
      .reduce((s: number, b: any) => s + Number(b.creditAmount) - Number(b.debitAmount), 0);
  }, [bookTransactions, selectedBookIds]);

  const selectedAmountsMatch = Math.abs(selectedStmtTotal - selectedBooksTotal) < 0.01;
  const canManualMatch = selectedStmtIds.size > 0 && selectedBookIds.size > 0 && selectedAmountsMatch;

  const refreshAll = useCallback(() => {
    setSelectedStmtIds(new Set());
    setSelectedBookIds(new Set());
  }, []);

  const toggleStmt = useCallback((txId: string) => {
    setSelectedStmtIds(p => { const n = new Set(p); n.has(txId) ? n.delete(txId) : n.add(txId); return n; });
  }, []);

  const toggleBook = useCallback((bid: string) => {
    setSelectedBookIds(p => { const n = new Set(p); n.has(bid) ? n.delete(bid) : n.add(bid); return n; });
  }, []);

  const toggleAllStmt = useCallback(() => {
    setSelectedStmtIds(p => p.size === pendingStmtLines.length ? new Set() : new Set(pendingStmtLines.map((l: any) => l.id)));
  }, [pendingStmtLines]);

  const toggleAllBooks = useCallback(() => {
    setSelectedBookIds(p => p.size === pendingBooks.length ? new Set() : new Set(pendingBooks.map((b: any) => b.id)));
  }, [pendingBooks]);

  const handleAutoMatch = () => autoMatchMutation.mutate(id!);

  // Auto-match on load
  useEffect(() => {
    if (isInProgress && pendingStmtLines.length > 0 && pendingBooks.length > 0 && !autoMatchMutation.isPending) {
      const t = setTimeout(() => autoMatchMutation.mutate(id!), 300);
      return () => clearTimeout(t);
    }
  }, [id, isInProgress, pendingStmtLines.length, pendingBooks.length]);

  const handleManualMatch = () => {
    manualMatchMutation.mutate({
      reconciliationId: id!,
      payload: {
        statementLineIds: Array.from(selectedStmtIds),
        bankTransactionIds: Array.from(selectedBookIds),
      },
    }, { onSuccess: refreshAll });
  };

  const handleProcess = () => processMutation.mutate(id!);
  const handleCancel = () => cancelMutation.mutate(id!);

  const handleUnmatchConfirm = () => {
    if (unmatchConfirmLineId) {
      unmatchMutation.mutate(
        { reconciliationId: id!, lineId: unmatchConfirmLineId },
        { onSuccess: () => setUnmatchConfirmLineId(null) },
      );
    }
  };

  if (isLoading) {
    return <div className="space-y-4 p-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!reconciliation) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Conciliación no encontrada</p>
        <Button variant="link" onClick={() => navigate('/dashboard/configuracion/conciliaciones')}>Volver</Button>
      </div>
    );
  }

  const statusLabel = RECONCILIATION_STATUS_OPTIONS[reconciliation.status as keyof typeof RECONCILIATION_STATUS_OPTIONS] || reconciliation.status;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/configuracion/conciliaciones')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Conciliación Bancaria</h2>
            <p className="text-sm text-muted-foreground">
              Cuenta: {reconciliation.bankAccount?.accountName || reconciliation.bankAccount?.accountNumber || reconciliation.bankAccountId}
              {' '}&middot;{' '}
              {formatDbDate(reconciliation.startDate)} → {formatDbDate(reconciliation.statementDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isCompleted ? 'success' : isInProgress ? 'warning' : 'default'}>{statusLabel}</Badge>
          {isInProgress && (
            <>
              <Button onClick={handleProcess} disabled={processMutation.isPending || !diferenciaCuadra} size="sm" className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                title={!diferenciaCuadra ? 'La diferencia debe ser 0 para procesar' : undefined}>
                <CheckCircle className="h-4 w-4 mr-1" />{processMutation.isPending ? 'Procesando...' : 'Procesar y Completar'}
              </Button>
              <Button onClick={handleCancel} disabled={cancelMutation.isPending} variant="destructive" size="sm">Cancelar</Button>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Saldo Extracto</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(statementBalance, 'VES')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Libros (Antes)</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(bookBalanceBefore, 'VES')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Libros (Después)</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(librosDespues, 'VES')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Movs. Conciliados</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(movimientosConciliados, 'VES')}</p></CardContent>
        </Card>
        <Card className={diferenciaCuadra ? 'border-green-500 bg-green-50/30' : 'border-red-300 bg-red-50/30'}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Diferencia</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-xl font-bold ${diferenciaCuadra ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(diferencia, 'VES')}</p>
            {diferenciaCuadra && isInProgress && <p className="text-xs text-green-600 mt-1 font-medium">Cuadra. Puede procesar.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {reconciliation.notes && (
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Notas</CardTitle></CardHeader><CardContent><p className="text-sm">{reconciliation.notes}</p></CardContent></Card>
      )}

      {/* Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Extracto Bancario */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Extracto Bancario</CardTitle>
                <Badge variant="outline">{statementLines.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isInProgress && (
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setShowAddLine(!showAddLine)}><Plus className="h-3 w-3 mr-1" /> Agregar Línea</Button>
                <Button size="sm" variant="outline" onClick={() => setShowUpload(true)}><FileSpreadsheet className="h-3 w-3 mr-1" /> Subir Excel</Button>
                <Button size="sm" variant="outline" onClick={handleAutoMatch} disabled={autoMatchMutation.isPending || pendingStmtLines.length === 0}>
                  <Wand2 className="h-3 w-3 mr-1" /> Auto-Conciliar ({pendingStmtLines.length})
                </Button>
              </div>
            )}

            {showAddLine && isInProgress && (
              <Card><CardContent className="pt-4">
                <AddStatementLineForm reconciliationId={id!} statementDate={stmtDate!} startDate={startDate}
                  onSuccess={() => setShowAddLine(false)} onCancel={() => setShowAddLine(false)} />
              </CardContent></Card>
            )}

            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Ref / Descripción</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciledStmtLines.map((l: any) => (
                    <TableRow key={l.id} className="bg-green-50/30">
                      <TableCell><Checkbox checked disabled /></TableCell>
                      <TableCell className="text-xs">{formatDbDate(l.transactionDate)}</TableCell>
                      <TableCell className="max-w-[160px]"><p className="truncate text-sm">{l.description}</p>{l.bankReference && <p className="text-xs text-muted-foreground">{l.bankReference}</p>}</TableCell>
                      <TableCell className="text-right text-sm">{Number(l.debitAmount) > 0 ? formatCurrency(l.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(l.creditAmount) > 0 ? formatCurrency(l.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge variant="success" className="text-xs">Conciliado</Badge></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))}
                  {matchedStmtLines.map((l: any) => (
                    <TableRow key={l.id} className="bg-blue-50/30">
                      <TableCell><Checkbox checked disabled /></TableCell>
                      <TableCell className="text-xs">{formatDbDate(l.transactionDate)}</TableCell>
                      <TableCell className="max-w-[160px]"><p className="truncate text-sm">{l.description}</p>{l.bankReference && <p className="text-xs text-muted-foreground">{l.bankReference}</p>}</TableCell>
                      <TableCell className="text-right text-sm">{Number(l.debitAmount) > 0 ? formatCurrency(l.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(l.creditAmount) > 0 ? formatCurrency(l.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">Emparejado</Badge></TableCell>
                      <TableCell>{isInProgress && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setUnmatchConfirmLineId(l.id); }}
                          title="Anular emparejamiento y eliminar línea">
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      )}</TableCell>
                    </TableRow>
                  ))}
                  {pendingStmtLines.map((l: any) => (
                    <TableRow key={l.id} onClick={() => isInProgress && toggleStmt(l.id)} className={isInProgress ? 'cursor-pointer hover:bg-blue-50/50' : ''}>
                      <TableCell><Checkbox checked={selectedStmtIds.has(l.id)} onCheckedChange={() => toggleStmt(l.id)} disabled={!isInProgress} /></TableCell>
                      <TableCell className="text-xs">{formatDbDate(l.transactionDate)}</TableCell>
                      <TableCell className="max-w-[160px]"><p className="truncate text-sm">{l.description}</p>{l.bankReference && <p className="text-xs text-muted-foreground">{l.bankReference}</p>}</TableCell>
                      <TableCell className="text-right text-sm">{Number(l.debitAmount) > 0 ? formatCurrency(l.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(l.creditAmount) > 0 ? formatCurrency(l.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">Pendiente</Badge></TableCell>
                      <TableCell>{isInProgress && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setGenerateModalId(l.id); }} title="Crear Movimiento">
                          <BookPlus className="h-4 w-4 text-purple-600" />
                        </Button>
                      )}</TableCell>
                    </TableRow>
                  ))}
                  {statementLines.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Sin líneas. Importe Excel o agregue manualmente.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {pendingStmtLines.length > 0 && isInProgress && (
              <div className="flex items-center justify-between text-sm">
                <Button variant="ghost" size="sm" onClick={toggleAllStmt}>{selectedStmtIds.size === pendingStmtLines.length ? 'Deseleccionar' : 'Seleccionar'} todos</Button>
                <span className="text-muted-foreground">
                  {selectedStmtIds.size > 0 ? `Extracto seleccionado: ${formatCurrency(selectedStmtTotal, 'VES')}` : ''}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Libros ERP (bank_transactions) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base">Libros ERP</CardTitle>
                <Badge variant="outline">{bookTransactions.length}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Movimientos bancarios (pendientes de conciliar) hasta la fecha de corte.</p>

            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Débito</TableHead>
                    <TableHead className="text-right">Crédito</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciledBooks.map((b: any) => (
                    <TableRow key={b.id} className="bg-green-50/30">
                      <TableCell><Checkbox checked disabled /></TableCell>
                      <TableCell className="text-xs">{formatDbDate(b.transactionDate)}</TableCell>
                      <TableCell className="max-w-[180px]"><p className="truncate text-sm">{b.description}</p>{b.bankReference && <p className="text-xs text-muted-foreground">{b.bankReference}</p>}</TableCell>
                      <TableCell className="text-right text-sm">{Number(b.debitAmount) > 0 ? formatCurrency(b.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(b.creditAmount) > 0 ? formatCurrency(b.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge variant="success" className="text-xs">Conciliado</Badge></TableCell>
                    </TableRow>
                  ))}
                  {matchedBooks.map((b: any) => (
                    <TableRow key={b.id} className="bg-blue-50/30">
                      <TableCell><Checkbox checked disabled /></TableCell>
                      <TableCell className="text-xs">{formatDbDate(b.transactionDate)}</TableCell>
                      <TableCell className="max-w-[180px]"><p className="truncate text-sm">{b.description}</p>{b.bankReference && <p className="text-xs text-muted-foreground">{b.bankReference}</p>}</TableCell>
                      <TableCell className="text-right text-sm">{Number(b.debitAmount) > 0 ? formatCurrency(b.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(b.creditAmount) > 0 ? formatCurrency(b.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">Emparejado</Badge></TableCell>
                    </TableRow>
                  ))}
                  {pendingBooks.map((b: any) => (
                    <TableRow key={b.id} onClick={() => isInProgress && toggleBook(b.id)} className={isInProgress ? 'cursor-pointer hover:bg-purple-50/50' : ''}>
                      <TableCell><Checkbox checked={selectedBookIds.has(b.id)} onCheckedChange={() => toggleBook(b.id)} disabled={!isInProgress} /></TableCell>
                      <TableCell className="text-xs">{formatDbDate(b.transactionDate)}</TableCell>
                      <TableCell className="max-w-[180px]"><p className="truncate text-sm">{b.description}</p>{b.bankReference && <p className="text-xs text-muted-foreground">{b.bankReference}</p>}</TableCell>
                      <TableCell className="text-right text-sm">{Number(b.debitAmount) > 0 ? formatCurrency(b.debitAmount, 'VES') : '-'}</TableCell>
                      <TableCell className="text-right text-sm">{Number(b.creditAmount) > 0 ? formatCurrency(b.creditAmount, 'VES') : '-'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">Pendiente</Badge></TableCell>
                    </TableRow>
                  ))}
                  {bookTransactions.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">Sin movimientos de libros en el rango.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {pendingBooks.length > 0 && isInProgress && (
              <div className="flex items-center justify-between text-sm">
                <Button variant="ghost" size="sm" onClick={toggleAllBooks}>{selectedBookIds.size === pendingBooks.length ? 'Deseleccionar' : 'Seleccionar'} todos</Button>
                <span className="text-muted-foreground">
                  {selectedBookIds.size > 0 ? `Libros seleccionados: ${formatCurrency(selectedBooksTotal, 'VES')}` : ''}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual Match bar */}
      {isInProgress && selectedStmtIds.size > 0 && selectedBookIds.size > 0 && (
        <Card className="border-blue-300 bg-blue-50/30">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="font-medium">Extracto:</span> {formatCurrency(selectedStmtTotal, 'VES')} ({selectedStmtIds.size} línea(s))
              </div>
              <Repeat className="h-4 w-4" />
              <div className="text-sm">
                <span className="font-medium">Libros:</span> {formatCurrency(selectedBooksTotal, 'VES')} ({selectedBookIds.size} mov(s))
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!selectedAmountsMatch && (
                <span className="text-red-600 text-sm font-medium">
                  Diferencia: {formatCurrency(selectedStmtTotal - selectedBooksTotal, 'VES')} — Los montos deben coincidir
                </span>
              )}
              <Button size="sm" onClick={handleManualMatch} disabled={!canManualMatch || manualMatchMutation.isPending}>
                <Repeat className="h-3 w-3 mr-1" /> Conciliar
              </Button>
              <Button size="sm" variant="ghost" onClick={refreshAll}><X className="h-3 w-3 mr-1" /> Limpiar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertModal
        isOpen={!!unmatchConfirmLineId}
        onClose={() => setUnmatchConfirmLineId(null)}
        onConfirm={handleUnmatchConfirm}
        loading={unmatchMutation.isPending}
        title="¿Anular y eliminar esta línea del extracto?"
        description="Se eliminará el emparejamiento y la línea temporal. Esta acción no se puede deshacer."
      />

      <BankReconciliationUploadModal open={showUpload} onOpenChange={setShowUpload} />

      {generateModalId && (
        <GenerateBookEntryModal
          reconciliationId={id!}
          statementLineId={generateModalId}
          statementLines={statementLines}
          open={!!generateModalId}
          onOpenChange={(open) => { if (!open) setGenerateModalId(null); }}
        />
      )}
    </div>
  );
}
