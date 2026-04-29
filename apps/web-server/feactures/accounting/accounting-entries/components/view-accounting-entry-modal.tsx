'use client';

import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { useAccountingEntryById } from '../hooks/use-query-accounting-entry';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Badge } from '@repo/shadcn/badge';
import { ENTRY_STATUS } from '../schemas/accounting-entry-options';
import { Loader2 } from 'lucide-react';
import { AccountingEntry } from '../schemas/accounting-entry.schema';

interface ViewAccountingEntryModalProps {
  open: boolean;
  defaultValues?: Partial<AccountingEntry>;
  onOpenChange: (open: boolean) => void;
}

export function ViewAccountingEntryModal({
  open,
  onOpenChange,
  defaultValues,
}: ViewAccountingEntryModalProps) {
  const entry = defaultValues;

  const getStatusLabel = (status: string) => {
    return (
      (ENTRY_STATUS as any)[status] || status
    );
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'secondary';
      case 'PENDING':
        return 'warning';
      case 'POSTED':
        return 'success';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] z-50">
        <DialogHeader>
          <DialogTitle>Detalle de Asiento Contable</DialogTitle>
          <DialogDescription>
          </DialogDescription>
        </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Nro. Comprobante
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {entry?.voucherNo || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fecha Asiento</p>
                  <p className="text-sm font-semibold">
                    {(() => {
                      const date = entry?.entryDate;
                      if (!date) return '-';
                      const dateStr = (date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0]) || '';
                      const dateObj = new Date(dateStr.replace(/-/g, '/'));
                      if (isNaN(dateObj.getTime())) return '-';
                      return format(dateObj, 'dd/MM/yyyy', { locale: es });
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fecha Contabilización</p>
                  <p className="text-sm font-semibold">
                    {(() => {
                      const date = entry?.postedAt;
                      if (!date) return '-';
                      const dateStr = (date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0]) || '';
                      const dateObj = new Date(dateStr.replace(/-/g, '/'));
                      if (isNaN(dateObj.getTime())) return '-';
                      return format(dateObj, 'dd/MM/yyyy', { locale: es });
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Estado</p>
                  <Badge variant={getStatusVariant(entry?.status || '') as any}>
                    {getStatusLabel(entry?.status || '')}
                  </Badge>
                </div>
                <div className="space-y-1 lg:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Descripción
                  </p>
                  <p className="text-sm font-semibold">{entry?.description}</p>
                </div>
                {/* {entry?.originType && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Origen
                    </p>
                    <p className="text-sm font-semibold">
                      {entry.originType}
                    </p>
                  </div>
                )} */}
                
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuenta Contable</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Débito</TableHead>
                      <TableHead className="text-right">Crédito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry?.details?.map((detail: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-primary">
                              {detail.account?.code}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {detail.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {detail.debit > 0
                            ? Number(detail.debit).toLocaleString('es-VE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {detail.credit > 0
                            ? Number(detail.credit).toLocaleString('es-VE', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end pr-4">
                <div className="w-64 space-y-2 border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Débito:</span>
                    <span className="font-mono font-semibold">
                      {entry?.details
                        ?.reduce((sum: number, d: any) => sum + Number(d.debit), 0)
                        .toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Crédito:</span>
                    <span className="font-mono font-semibold">
                      {entry?.details
                        ?.reduce((sum: number, d: any) => sum + Number(d.credit), 0)
                        .toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

       
      </DialogContent>
    </Dialog>
  );
}
