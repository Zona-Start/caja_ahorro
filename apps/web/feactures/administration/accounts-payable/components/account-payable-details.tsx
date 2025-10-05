'use client';

import { Badge } from '@repo/shadcn/components/ui/badge';
import { ScrollArea } from '@repo/shadcn/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import {
  useAppliedTransactions,
  usePaymentHistory,
} from '../hooks/use-query-payment-history';
import { AccountPayableSchemaAPI } from '../schemas';
import {
  ACCOUNT_PAYABLE_STATUS_TYPES,
  TRANSACTION_TYPES,
} from '../schemas/account-payable-options';

interface DetailsProps {
  accountPayable: AccountPayableSchemaAPI;
}

export function AccountPayableDetails({ accountPayable }: DetailsProps) {
  const statusText =
    ACCOUNT_PAYABLE_STATUS_TYPES[
      accountPayable.status as keyof typeof ACCOUNT_PAYABLE_STATUS_TYPES
    ] || accountPayable.status;

  const { data: paymentHistory, isLoading: isLoadingHistory } =
    usePaymentHistory(accountPayable.id);

  const { data: appliedTransactions, isLoading: isLoadingApplied } =
    useAppliedTransactions(accountPayable.id);

  const payments = paymentHistory?.data;
  const appliedCredits = appliedTransactions?.data;

  return (
    <ScrollArea className="h-[75vh] p-1">
      <div className="space-y-4 p-4">
        {/* Supplier Info */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Información del Proveedor
          </h3>
          <p>
            <strong>Nombre:</strong> {accountPayable.supplierName}
          </p>
        </div>

        {/* Account Payable Info */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Información de la Cuenta por Pagar
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>
              <strong>Referencia CxP:</strong>{' '}
              {accountPayable.accountsPayableNumber}
            </p>
            <p>
              <strong>N° Factura:</strong>{' '}
              {accountPayable.supplierInvoiceNumber || 'N/A'}
            </p>
            <p>
              <strong>Fecha de Emisión:</strong>{' '}
              {new Date(accountPayable.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong>Fecha de Vencimiento:</strong>{' '}
              {accountPayable.dueDate
                ? new Date(accountPayable.dueDate).toLocaleDateString()
                : 'N/A'}
            </p>
            <p>
              <strong>Estado de Cuenta:</strong> <Badge>{statusText}</Badge>
            </p>
            <p>
              <strong>Aprobado a pagar:</strong>{' '}
              {accountPayable.isAuthorizePayment ? 'Sí' : 'No'}
            </p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-4 border rounded-lg bg-muted/40">
          <h3 className="font-semibold text-lg mb-2">Resumen Financiero</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Monto Original:</span>{' '}
              <span>
                {Number(accountPayable.originalAmount).toFixed(2)} Bs.
              </span>
            </div>
            <div className="flex justify-between">
              <span>Monto Pagado:</span>{' '}
              <span>{Number(accountPayable.paidAmount).toFixed(2)} Bs.</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Saldo Pendiente:</span>{' '}
              <span>
                {Number(accountPayable.remainingAmount).toFixed(2)} Bs.
              </span>
            </div>
          </div>
        </div>

        {/* Applied Advances and Credit Notes */}

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Anticipos y Notas de Crédito o Débito Aplicadas
          </h3>
          {isLoadingApplied ? (
            <p>Cargando...</p>
          ) : appliedCredits && appliedCredits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Monto Aplicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appliedCredits.map((credit) => (
                  <TableRow key={credit.id}>
                    <TableCell>{credit.transactionNumber}</TableCell>
                    <TableCell>
                      {TRANSACTION_TYPES[
                        credit.transactionType as keyof typeof TRANSACTION_TYPES
                      ] || credit.transactionType}
                    </TableCell>

                    <TableCell className="text-right">
                      {Number(credit.amount).toFixed(2)} Bs.
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay anticipos ni notas de crédito aplicadas.
            </p>
          )}
        </div>

        {/* Payment History */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Historial de Pagos</h3>
          {isLoadingHistory ? (
            <p>Cargando historial...</p>
          ) : payments && payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{payment.paymentNumber}</TableCell>
                    <TableCell>
                      {new Date(
                        payment.processedAt || payment.requestedAt,
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(payment.totalAmount).toFixed(2)} Bs.
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay historial de pagos para mostrar.
            </p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
