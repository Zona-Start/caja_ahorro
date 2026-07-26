import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Separator } from '@repo/shadcn/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/shadcn/tabs';
import { Skeleton } from '@repo/shadcn/skeleton';
import {
  ArrowLeft,
  CheckCircle,
  Plus,
  Link,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';
import {
  useBankReconciliationQuery,
  useProcessReconciliationMutation,
  useCancelReconciliationMutation,
  useAddBulkMovementsMutation,
  useAvailableTransactionsQuery,
} from '../hooks/use-bank-reconciliation-query';
import { RECONCILIATION_STATUS_OPTIONS } from '../schemas/bank-reconciliation-options';
import type { BankTransaction } from '../schemas/bank-reconciliation.schema';
import { BankReconciliationMovementForm } from './bank-reconciliation-movement-form';
import { BankReconciliationUploadModal } from './bank-reconciliation-upload';
import { Checkbox } from '@repo/shadcn/checkbox';
import { useToastSystem } from '@/hooks/use-toast-system';

export function BankReconciliationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: reconData, isLoading } = useBankReconciliationQuery(id!, !!id);
  const processMutation = useProcessReconciliationMutation();
  const cancelMutation = useCancelReconciliationMutation();
  const bulkMutation = useAddBulkMovementsMutation();
  const { data: availableTxData } = useAvailableTransactionsQuery(id!, !!id);
  const { error: toastError } = useToastSystem();

  const [showAddMovement, setShowAddMovement] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());

  const reconciliation = reconData?.data;
  const transactions = reconciliation?.transactions || [];
  const availableTransactions = availableTxData?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!reconciliation) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Conciliación no encontrada</p>
        <Button
          variant="link"
          onClick={() => navigate('/dashboard/configuracion/conciliaciones')}
        >
          Volver a la lista
        </Button>
      </div>
    );
  }

  const isInProgress = reconciliation.status === 'IN_PROGRESS';
  const statusLabel =
    RECONCILIATION_STATUS_OPTIONS[
      reconciliation.status as keyof typeof RECONCILIATION_STATUS_OPTIONS
    ] || reconciliation.status;
  const statusVariant =
    reconciliation.status === 'COMPLETED'
      ? 'success'
      : reconciliation.status === 'IN_PROGRESS'
        ? 'warning'
        : reconciliation.status === 'REVIEWED'
          ? 'secondary'
          : 'default';

  const handleProcess = () => {
    processMutation.mutate(id!);
  };

  const handleCancel = () => {
    cancelMutation.mutate(id!);
  };

  const handleBulkLink = () => {
    if (selectedTxIds.size === 0) {
      toastError('Selecciona al menos un movimiento para vincular');
      return;
    }
    bulkMutation.mutate({
      reconciliationId: id!,
      movementIds: Array.from(selectedTxIds),
    });
  };

  const toggleTxSelection = (txId: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const toggleAllAvailable = () => {
    if (selectedTxIds.size === availableTransactions.length) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(availableTransactions.map((t) => t.id)));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate('/dashboard/configuracion/conciliaciones')
            }
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Conciliación Bancaria
            </h2>
            <p className="text-sm text-muted-foreground">
              Fecha de Corte:{' '}
              {new Date(reconciliation.statementDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant as any}>{statusLabel}</Badge>
          {isInProgress && (
            <>
              <Button
                onClick={handleProcess}
                disabled={processMutation.isPending}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {processMutation.isPending
                  ? 'Procesando...'
                  : 'Procesar y Completar'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                variant="destructive"
                size="sm"
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Extracto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(
                reconciliation.statementEndingBalance ?? 0,
                'VES',
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Libros (Antes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(reconciliation.bookBalanceBefore ?? 0, 'VES')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Libros (Después)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {reconciliation.bookBalanceAfter != null
                ? formatCurrency(reconciliation.bookBalanceAfter, 'VES')
                : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Diferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                reconciliation.difference === 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {reconciliation.difference != null
                ? formatCurrency(reconciliation.difference, 'VES')
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {reconciliation.notes && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{reconciliation.notes}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">
            Movimientos en Conciliación ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Movimientos Disponibles ({availableTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4 mt-4">
          {isInProgress && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowAddMovement(!showAddMovement)}
              >
                <Plus className="h-4 w-4 mr-1" /> Agregar Movimiento
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowUpload(true)}
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" /> Subir Excel
              </Button>
            </div>
          )}

          {showAddMovement && isInProgress && (
            <Card>
              <CardContent className="pt-4">
                <BankReconciliationMovementForm
                  reconciliationId={id!}
                  bankAccountId={reconciliation.bankAccountId}
                  onSuccess={() => setShowAddMovement(false)}
                  onCancel={() => setShowAddMovement(false)}
                />
              </CardContent>
            </Card>
          )}

          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay movimientos en esta conciliación. Agrega movimientos
              manuales o importa desde Excel.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Débito</TableHead>
                    <TableHead>Crédito</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs">
                        {tx.internalCode || '-'}
                      </TableCell>
                      <TableCell>
                        {new Date(tx.transactionDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell>{tx.category || '-'}</TableCell>
                      <TableCell>
                        {tx.debitAmount
                          ? formatCurrency(tx.debitAmount, 'VES')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {tx.creditAmount
                          ? formatCurrency(tx.creditAmount, 'VES')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Conciliado</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4 mt-4">
          {availableTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay movimientos pendientes disponibles para vincular.
            </p>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkLink}
                  disabled={
                    selectedTxIds.size === 0 || bulkMutation.isPending
                  }
                >
                  <Link className="h-4 w-4 mr-1" /> Vincular Seleccionados (
                  {selectedTxIds.size})
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedTxIds.size ===
                              availableTransactions.length &&
                            availableTransactions.length > 0
                          }
                          onCheckedChange={toggleAllAvailable}
                        />
                      </TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Débito</TableHead>
                      <TableHead>Crédito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableTransactions.map((tx: BankTransaction) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedTxIds.has(tx.id)}
                            onCheckedChange={() =>
                              toggleTxSelection(tx.id)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {tx.internalCode || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            tx.transactionDate,
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell>
                          {tx.debitAmount
                            ? formatCurrency(tx.debitAmount, 'VES')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {tx.creditAmount
                            ? formatCurrency(tx.creditAmount, 'VES')
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      <BankReconciliationUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
      />
    </div>
  );
}
