'use client';

import { formatCurrency } from '@/lib/formatCurrent';
import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { DataTableSkeleton } from '@repo/shadcn/components/ui/table/data-table-skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { format } from 'date-fns';
import { useQueryLoanDisbursementBatchDetails } from '../hooks/use-query-loan-disbursement-batch';
import { LOAN_DISBURSEMENT_BATCH_STATUS } from '../schemas/loan-disbursement/batch-options';

interface LoanDisbursementBatchDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanId: number;
}

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | string | number | null | undefined;
}) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <p className="text-sm text-muted-foreground">{label}</p>
    <div className="text-sm font-medium text-right">{value || 'N/A'}</div>
  </div>
);

export function LoanDisbursementBatchDetailsModal({
  isOpen,
  onClose,
  loanId,
}: LoanDisbursementBatchDetailsModalProps) {
  const { data: loanDisbursementBatch, isLoading } =
    useQueryLoanDisbursementBatchDetails(loanId);

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DataTableSkeleton columnCount={2} rowCount={5} />
        </DialogContent>
      </Dialog>
    );
  }

  if (!loanDisbursementBatch) return null;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  };

  const status = loanDisbursementBatch.status;
  const statusLabel =
    LOAN_DISBURSEMENT_BATCH_STATUS[status as keyof typeof LOAN_DISBURSEMENT_BATCH_STATUS] || status;

  const statusVariant:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'success'
    | 'warning' = (() => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'UPLOADED':
        return 'warning';
      case 'PROCESSED':
        return 'success';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'default';
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Lote de Pago</DialogTitle>
          <DialogDescription>
            ID del Lote: {loanDisbursementBatch.loanDisbursementBatchReference}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 pt-4">
              <div className="md:col-span-2">
                <DetailItem
                  label="Descripción"
                  value={loanDisbursementBatch.description}
                />
              </div>
              <DetailItem
                label="Estado"
                value={
                  <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                }
              />
              <DetailItem
                label="Monto Total"
                value={formatCurrency(Number(loanDisbursementBatch.totalAmount), 'VES')}
              />
              <DetailItem
                label="Cantidad de Ítems"
                value={loanDisbursementBatch.recordCount}
              />
              <DetailItem label="Moneda" value={loanDisbursementBatch.currencyCode} />
              <DetailItem
                label="Banco"
                value={loanDisbursementBatch.bank?.name || 'N/A'}
              />
              <DetailItem
                label="Referencia Bancaria"
                value={loanDisbursementBatch.bankReference}
              />
              <DetailItem
                label="Fecha de Procesamiento"
                value={formatDate(loanDisbursementBatch.processedAt)}
              />
              <DetailItem
                label="Fecha de Creación"
                value={formatDate(loanDisbursementBatch.createdAt)}
              />
            </CardContent>
          </Card>

          {loanDisbursementBatch.items && loanDisbursementBatch.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ítems del Lote</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Beneficiario</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanDisbursementBatch.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">
                            {item.beneficiaryName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Cédula: {item.beneficiaryId}
                          </div>
                        </TableCell>
                        <TableCell>{item.beneficiaryAccountNumber}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.amount), 'VES')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant}>
                            {LOAN_DISBURSEMENT_BATCH_STATUS[
                              item.status as keyof typeof LOAN_DISBURSEMENT_BATCH_STATUS
                            ]
                              ? LOAN_DISBURSEMENT_BATCH_STATUS[
                                  item.status as keyof typeof LOAN_DISBURSEMENT_BATCH_STATUS
                                ]
                              : 'En Proceso'}
                          </Badge>
                          {item.rejectionReason && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.rejectionReason}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
