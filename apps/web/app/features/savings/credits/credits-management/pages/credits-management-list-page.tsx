import { useState } from 'react';
import { Separator } from '@repo/shadcn/separator';
import { useLoaderData } from 'react-router';
import { queryClient } from '@/lib/query-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/shadcn/dialog';
import { Button } from '@repo/shadcn/button';
import { OrdinaryCreditsHeader } from '../components/ordinary-credits-header';
import { OrdinaryCreditsList } from '../components/ordinary-credits-list';
import { OrdinaryCreditsTableAction } from '../components/credits-tables/ordinary-credits-table-action';
import { CreateCreditModal } from '../components/credit-create-modal';
import { useCreditsFilters } from '../hooks/use-credits-filters';
import { creditManagementLoader } from '../loaders/credits-management.loader';
import { creditManagementAction } from '../loaders/credits-management.action';
import type { CreditTableRow } from '../components/credits-tables/columns';
import { useCreditDetails } from '../hooks/use-credits-management-query';
import { ESTATUS_TYPES, STATUS_CLASSES } from '../schemas/credits-management-options';
import {
  Calculator,
  Building2,
  Settings,
} from 'lucide-react';

export const clientLoader = creditManagementLoader(queryClient);

export const clientAction = creditManagementAction(queryClient);

function formatCurrency(n: number | string) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return num?.toLocaleString('es', { minimumFractionDigits: 2 }) ?? '0,00';
}

export default function CreditsManagementListPage() {
  const loaderResult = useLoaderData<typeof clientLoader>();
  const { filters } = useCreditsFilters();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewData, setViewData] = useState<CreditTableRow | null>(null);
  const { data: detailData } = useCreditDetails(viewData?.id || '', {
    enabled: !!viewData?.id,
  });


  return (
    <div className="space-y-4">
      <OrdinaryCreditsHeader />
      <Separator />
      <OrdinaryCreditsTableAction onNewCredit={() => setModalOpen(true)} />
      <OrdinaryCreditsList
        page={filters.page}
        search={filters.search}
        limit={filters.limit}
        status={filters.status}
        type={filters.type}
        modality={filters.modality}
        onViewDetails={(data) => setViewData(data)}
      />
      <CreateCreditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* View Details Dialog */}
      <Dialog open={!!viewData} onOpenChange={(v) => { if (!v) setViewData(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Detalles del Crédito</DialogTitle>
          </DialogHeader>
          {!!detailData && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-muted-foreground">N° Ref:</span>{' '}
                  <span className="font-mono">
                    {viewData?.customReference || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Asociado:</span>{' '}
                  {viewData?.associateFullname || '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Cédula:</span>{' '}
                  <span className="font-mono">
                    {viewData?.associateCedula || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{' '}
                  {viewData?.creditTypeName || '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Tasa Anual:</span>{' '}
                  <span className="font-mono">
                    {parseFloat(viewData?.interestRate || '0')}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Plazo:</span>{' '}
                  {viewData?.termUnits || '—'}{' '}
                  {viewData?.termType === 'installments'
                    ? 'quincenas'
                    : 'meses'}
                </div>
                <div>
                  <span className="text-muted-foreground">F. Inicio:</span>{' '}
                  {viewData?.startDate
                    ? new Date(viewData.startDate).toLocaleDateString('es')
                    : '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">F. Fin:</span>{' '}
                  {viewData?.endDate
                    ? new Date(viewData.endDate).toLocaleDateString('es')
                    : '—'}
                </div>
                <div>
                  <span className="text-muted-foreground">Monto:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData?.requestedAmount || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gasto Admin:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData?.expensesAmount || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cuota:</span>{' '}
                  <span className="font-mono font-semibold text-blue-600">
                    {formatCurrency(viewData?.installmentAmount || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Interés Total:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData?.totalInterest || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Abono por retiro Haberes:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData?.haberesPayment || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Abono por pago directo:</span>{' '}
                  <span className="font-mono">
                    {formatCurrency(viewData?.directPayment || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total a Pagar:</span>{' '}
                  <span className="font-mono font-semibold">
                    {formatCurrency(viewData?.totalPayable || '0')} Bs
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>{' '}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[viewData?.status || ''] || 'bg-muted text-muted-foreground'}`}
                  >
                    {ESTATUS_TYPES[
                      viewData?.status as keyof typeof ESTATUS_TYPES
                    ] || viewData?.status}
                  </span>
                </div>
                {viewData?.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notas:</span>{' '}
                    {viewData.notes}
                  </div>
                )}
              </div>

              {!!detailData && (detailData as any).items?.length > 0 && (
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold">
                      CASA COMERCIAL
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="py-1 text-left">#</th>
                        <th className="py-1 text-left">Item</th>
                        <th className="py-1 text-right">Cant.</th>
                        <th className="py-1 text-right">P/U</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailData as any).items.map(
                        (it: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1">{i + 1}</td>
                            <td className="py-1">
                              {it.itemName || it.itemDescription || it.itemType || '—'}
                            </td>
                            <td className="py-1 text-right">
                              {it.quantity}
                            </td>
                            <td className="py-1 text-right font-mono">
                              {formatCurrency(it.agreedSellingPrice)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}

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
                                  {formatCurrency(
                                    inst.principalAmount,
                                  )}
                                </td>
                                <td className="py-1 text-right font-mono">
                                  {formatCurrency(
                                    inst.interestAmount,
                                  )}
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
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${inst.paymentStatus === 'PAID'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : inst.paymentStatus ===
                                        'PARTIAL'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : inst.paymentStatus ===
                                          'OVERDUE'
                                          ? 'bg-destructive/20 text-destructive'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                  >
                                    {inst.paymentStatus === 'PAID'
                                      ? 'Pagado'
                                      : inst.paymentStatus === 'PARTIAL'
                                        ? 'Parcial'
                                        : inst.paymentStatus ===
                                          'OVERDUE'
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
