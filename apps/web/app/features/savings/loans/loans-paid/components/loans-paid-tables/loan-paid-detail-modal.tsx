'use client';

import { Button } from '@repo/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Separator } from '@repo/shadcn/separator';
import { Loader2 } from 'lucide-react';
import type { LoanPaymentByIdResponse } from '../../schemas/loans-paid-api-response';

interface LoanPaidDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: LoanPaymentByIdResponse | undefined;
  isLoading: boolean;
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  PAYING: 'Pago de Cuota',
  CANCELLATION: 'Cancelación',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEPOSIT: 'Depósito',
  MOBILE_PAYMENT: 'Pago Móvil',
  OTHER: 'Otro',
};

export function LoanPaidDetailModal({
  isOpen,
  onClose,
  data,
  isLoading,
}: LoanPaidDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Pago</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Referencia:</span>{' '}
                <span className="font-mono">{data.customReference || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>{' '}
                <span className={data.status === 'CANCELED' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                  {data.status === 'CANCELED' ? 'Anulado' : 'Completado'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cédula:</span>{' '}
                <span className="font-mono">{data.associateCedula || '-'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Asociado:</span>{' '}
                {data.associateFullname || '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Fecha de Pago:</span>{' '}
                {new Date(data.paymentDate).toLocaleDateString('es-VE')}
              </div>
              <div>
                <span className="text-muted-foreground">Tipo:</span>{' '}
                {PAYMENT_TYPE_LABELS[data.paymentType] || data.paymentType}
              </div>
              <div>
                <span className="text-muted-foreground">Método:</span>{' '}
                {PAYMENT_METHOD_LABELS[data.paymentMethod] || data.paymentMethod}
              </div>
              <div>
                <span className="text-muted-foreground">Cuenta Bancaria:</span>{' '}
                {data.bankAccountName || data.bankAccountNumber
                  ? `${data.bankAccountName || ''} ${data.bankAccountNumber ? `(${data.bankAccountNumber.slice(-4)})` : ''}`
                  : '-'}
              </div>
              <div>
                <span className="text-muted-foreground">Monto Pagado:</span>{' '}
                <span className="font-bold text-green-600">
                  {Number(data.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Saldo Pendiente:</span>{' '}
                <span className="font-medium text-orange-600">
                  {Number(data.balancePending).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs
                </span>
              </div>
            </div>

            {data.transactionReference && (
              <div className="text-sm">
                <span className="text-muted-foreground">Referencia de Transacción:</span>{' '}
                {data.transactionReference}
              </div>
            )}

            {data.comment && (
              <div className="text-sm">
                <span className="text-muted-foreground">Comentario:</span>{' '}
                {data.comment}
              </div>
            )}

            {data.details && data.details.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Cuotas Pagadas</h4>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Vencimiento</th>
                          <th className="px-3 py-2 text-right">Capital</th>
                          <th className="px-3 py-2 text-right">Interés</th>
                          <th className="px-3 py-2 text-right">Cuota</th>
                          <th className="px-3 py-2 text-right">Monto Pagado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.details.map((det) => (
                          <tr key={det.id} className="border-b last:border-0">
                            <td className="px-3 py-1.5">{det.installmentNumber || '-'}</td>
                            <td className="px-3 py-1.5">
                              {det.dueDate
                                ? new Date(det.dueDate).toLocaleDateString('es-VE')
                                : '-'}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono">
                              {Number(det.principalAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono">
                              {Number(det.interestAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono">
                              {Number(det.totalInstallmentAmount || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-green-600">
                              {Number(det.amount).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!isLoading && data && (
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
