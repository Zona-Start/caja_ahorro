'use client';

import { useState } from 'react';
import { Separator } from '@repo/shadcn/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { Calculator } from 'lucide-react';
import { LoansHeader } from '../components/ordinary-loans-header';
import { LoansTableAction } from '../components/loans-tables/ordinary-loans-table-action';
import { OrdinaryLoansList } from '../components/ordinary-loans-list';
import { CreateLoanModal } from '../components/loan-create-modal';
import { useLoansFilters } from '../hooks/use-loans-filters';
import { useLoanDetails } from '../hooks/use-loans-management-query';
import { ESTATUS_TYPES } from '../schemas/loans-management-options';
import type { LoanTableRow } from '../components/loans-tables/columns';

function formatCurrency(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return num?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

export default function LoansManagementListPage() {
  const { filters, setFilters } = useLoansFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewData, setViewData] = useState<LoanTableRow | null>(null);
  const { data: detailData } = useLoanDetails(viewData?.id || '', {
    enabled: !!viewData?.id,
  });

  return (
    <div className="space-y-4">
      <LoansHeader />
      <Separator />
      <LoansTableAction
        filters={filters}
        setFilters={setFilters}
        onNewLoan={() => setModalOpen(true)}
      />
      <OrdinaryLoansList
        page={filters.page}
        limit={filters.limit}
        search={filters.search}
        status={filters.status}
        type={filters.type}
        modality={filters.modality}
        onViewDetails={(data) => setViewData(data)}
      />
      <CreateLoanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* View Details Dialog */}
      <Dialog open={!!viewData} onOpenChange={(v) => { if (!v) setViewData(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalles del Préstamo</DialogTitle>
          </DialogHeader>
          {!!viewData && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">N° Ref:</span>{' '}
                  <span className="font-mono">
                    {viewData.customReference || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Asociado:</span>{' '}
                  {viewData.associateFullname || '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Cédula:</span>{' '}
                  <span className="font-mono">
                    {viewData.associateCedula || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  {viewData.loanTypeName || '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Tasa Anual:</span>{' '}
                  <span className="font-mono">
                    {parseFloat(viewData.interestRate || '0')}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plazo:</span>{' '}
                  {viewData.termUnits || '—'}{' '}
                  {viewData.termType === 'installments'
                    ? 'quincenas'
                    : 'meses'}
                </div>
                <div>
                  <span className="text-muted-foreground">F. Inicio:</span>{' '}
                  {viewData.startDate
                    ? new Date(viewData.startDate).toLocaleDateString('es')
                    : '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">F. Fin:</span>{' '}
                  {viewData.endDate
                    ? new Date(viewData.endDate).toLocaleDateString('es')
                    : '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Monto:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData.requestedAmount || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gasto Admin:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData.expensesAmount || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuota:</span>{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {formatCurrency(viewData.installmentAmount || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Interés Total:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData.totalInterest || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total a Pagar:</span>{' '}
                  <span className="font-mono font-semibold">
                    {formatCurrency(viewData.totalPayable || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{' '}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      viewData.status === 'REQUESTED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : viewData.status === 'APPROVED'
                          ? 'bg-blue-100 text-blue-800'
                          : viewData.status === 'DISBURSED'
                            ? 'bg-amber-100 text-amber-800'
                            : viewData.status === 'IN_PAYMENT'
                              ? 'bg-purple-100 text-purple-800'
                              : viewData.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ESTATUS_TYPES[
                      viewData.status as keyof typeof ESTATUS_TYPES
                    ] || viewData.status}
                  </span>
                </div>
                {viewData.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notas:</span>{' '}
                    {viewData.notes}
                  </div>
                )}
              </div>

              {!!detailData &&
                (detailData as any).amortizationSchedule?.length > 0 && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold">
                        TABLA DE AMORTIZACIÓN
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="py-1 text-left">#</th>
                            <th className="py-1 text-left">Venc.</th>
                            <th className="py-1 text-right">Capital</th>
                            <th className="py-1 text-right">Interés</th>
                            <th className="py-1 text-right">Cuota</th>
                            <th className="py-1 text-right">Saldo</th>
                            <th className="py-1 text-left">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailData as any).amortizationSchedule.map(
                            (inst: any) => (
                              <tr
                                key={inst.installmentNumber}
                                className="border-b last:border-0"
                              >
                                <td className="py-1">
                                  {inst.installmentNumber}
                                </td>
                                <td className="py-1">
                                  {new Date(
                                    inst.dueDate,
                                  ).toLocaleDateString('es')}
                                </td>
                                <td className="py-1 text-right font-mono">
                                  {formatCurrency(inst.principalAmount)}
                                </td>
                                <td className="py-1 text-right font-mono">
                                  {formatCurrency(inst.interestAmount)}
                                </td>
                                <td className="py-1 text-right font-mono">
                                  {formatCurrency(
                                    inst.totalInstallmentAmount,
                                  )}
                                </td>
                                <td className="py-1 text-right font-mono">
                                  {formatCurrency(
                                    inst.principalBalancePending,
                                  )}
                                </td>
                                <td className="py-1">
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                      inst.paymentStatus === 'PAID'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : inst.paymentStatus === 'PARTIAL'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : inst.paymentStatus === 'OVERDUE'
                                            ? 'bg-destructive/20 text-destructive'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {inst.paymentStatus === 'PAID'
                                      ? 'Pagado'
                                      : inst.paymentStatus === 'PARTIAL'
                                        ? 'Parcial'
                                        : inst.paymentStatus === 'OVERDUE'
                                          ? 'Vencido'
                                          : 'Pendiente'}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
            </div>
          )}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => setViewData(null)}
              size="sm"
              variant="outline"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
