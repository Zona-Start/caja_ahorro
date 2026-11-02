import { useAccountingAccounts } from '@/features/accounting/accounting-accounts/hooks/use-accounting-accounts-query';
import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { apiClient } from '@/lib/api-client';
import { formatDbDate } from '@/lib/format-utils';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Label } from '@repo/shadcn/label';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Skeleton } from '@repo/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/shadcn/table';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useGeneralLedger } from '../hooks/use-accounting-reports-query';
import { AccountingReportsService } from '../services/accounting-reports-service';
import { ReportDatePicker } from './report-date-picker';
import { ReportFiltersRequired } from './report-filters-required';

export function GeneralLedgerReport() {
  const { data: cyclesData } = useAccountingCycles();
  const { data: accountsData } = useAccountingAccounts();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    accountPlanId: '',
    page: 1,
  });

  const accountOptions = useMemo(() => {
    return (
      accountsData?.map((account: any) => ({
        value: account.id!.toString(),
        label: `${account.code} - ${account.name}`,
      })) || []
    );
  }, [accountsData]);

  const { data, isLoading } = useGeneralLedger({
    accountingCycleId: selectedCycleId,
    companyId: '1',
    ...filters,
    limit: 50,
  });

  const hasRequiredFilters =
    !!selectedCycleId && !!filters.startDate && !!filters.endDate;

  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const { error: showError, success: showSuccess } = useToastSystem();

  const selectedCycle = useMemo(
    () =>
      cyclesData?.find(
        (cycle: any) => String(cycle.id) === String(selectedCycleId),
      ),
    [cyclesData, selectedCycleId],
  );

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (selectedCycleId) params.set('accountingCycleId', selectedCycleId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.accountPlanId)
      params.set('accountPlanId', filters.accountPlanId);
    return params;
  };

  const formatFilterDate = (value?: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  };

  const getFilterDateLabel = () => {
    const from = formatFilterDate(filters.startDate);
    const to = formatFilterDate(filters.endDate);
    if (from && to) return `Del ${from} al ${to}`;
    if (from) return `Desde ${from}`;
    if (to) return `Hasta ${to}`;
    return 'Todos los movimientos';
  };

  const handleExportPdf = async () => {
    if (!hasRequiredFilters || exporting) return;

    setExporting('pdf');
    try {
      const params = buildQueryParams();
      const response = await apiClient.get(
        `/accounting-reports/general-ledger/pdf?${params.toString()}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `libro_mayor_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess('Libro Mayor exportado a PDF');
    } catch (error) {
      showError({
        title: 'Error al exportar PDF',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF del Libro Mayor.',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!hasRequiredFilters || exporting) return;

    setExporting('excel');
    try {
      const result = await AccountingReportsService.getGeneralLedger({
        accountingCycleId: selectedCycleId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        accountPlanId: filters.accountPlanId || undefined,
        page: 1,
        limit: 10000,
      });

      const rows: (string | number)[][] = [
        ['LIBRO MAYOR'],
        ['Ciclo', selectedCycle?.description ?? ''],
        ['Rango', getFilterDateLabel()],
        [],
        ['Cuenta', 'Nombre', 'Fecha', 'Descripción', 'Debe', 'Haber', 'Saldo'],
      ];

      for (const account of result.data) {
        rows.push([
          account.accountCode,
          account.accountName,
          '',
          'Saldo inicial',
          '',
          '',
          Number(account.initialBalance) || 0,
        ]);

        for (const entry of account.entries) {
          rows.push([
            account.accountCode,
            account.accountName,
            formatDbDate(entry.entryDate),
            entry.description,
            Number(entry.debit) || 0,
            Number(entry.credit) || 0,
            Number(entry.balance) || 0,
          ]);
        }

        rows.push([
          account.accountCode,
          account.accountName,
          '',
          'Totales',
          Number(account.totalDebit) || 0,
          Number(account.totalCredit) || 0,
          Number(account.finalBalance) || 0,
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 38 },
        { wch: 12 },
        { wch: 50 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Libro Mayor');
      XLSX.writeFile(
        workbook,
        `libro_mayor_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      showSuccess('Libro Mayor exportado a Excel');
    } catch (error) {
      showError({
        title: 'Error al exportar Excel',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el Excel del Libro Mayor.',
      });
    } finally {
      setExporting(null);
    }
  };

  const isExporting = exporting !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle">Ciclo Contable</Label>
              <SelectSearchable
                options={
                  cyclesData?.map((cycle: any) => ({
                    value: cycle.id!.toString(),
                    label: cycle.description,
                  })) || []
                }
                onValueChange={(value) => setSelectedCycleId(value || '')}
                placeholder="Seleccione el ciclo contable"
                defaultValue={selectedCycleId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <ReportDatePicker
                id="startDate"
                value={filters.startDate}
                onChange={(value) =>
                  setFilters({ ...filters, startDate: value })
                }
                placeholder="Seleccionar fecha inicio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <ReportDatePicker
                id="endDate"
                value={filters.endDate}
                onChange={(value) => setFilters({ ...filters, endDate: value })}
                placeholder="Seleccionar fecha fin"
                minDate={
                  filters.startDate
                    ? new Date(`${filters.startDate}T12:00:00`)
                    : undefined
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Cuenta</Label>
              <SelectSearchable
                options={accountOptions}
                onValueChange={(value) =>
                  setFilters({ ...filters, accountPlanId: value || '' })
                }
                placeholder="Todas las cuentas"
                defaultValue={filters.accountPlanId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Libro Mayor</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasRequiredFilters || isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleExportPdf}
                disabled={isExporting}
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportExcel}
                disabled={isExporting}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {!hasRequiredFilters ? (
            <ReportFiltersRequired />
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {data?.data.map((account: any) => (
                <div
                  key={account.accountPlanId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3">
                    <span className="font-bold text-lg">
                      {account.accountCode} - {account.accountName}
                    </span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {account.entries.map((entry: any) => (
                        <TableRow key={entry.entryId}>
                          <TableCell>
                            {new Date(entry.entryDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(entry.debit) > 0
                              ? Number(entry.debit).toLocaleString('es-VE', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(entry.credit) > 0
                              ? Number(entry.credit).toLocaleString('es-VE', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(entry.balance).toLocaleString('es-VE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/30">
                        <TableCell colSpan={2} className="text-right">
                          Totales
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(account.totalDebit).toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(account.totalCredit).toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(account.finalBalance).toLocaleString(
                            'es-VE',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}

              {data?.meta && (
                <div className="flex justify-end">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: Math.max((prev.page || 1) - 1, 1),
                        }))
                      }
                      disabled={!data.meta.hasPreviousPage}
                    >
                      Anterior
                    </Button>
                    <div className="text-sm font-medium">
                      Página {data.meta.page} de {data.meta.totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: Math.min(
                            (prev.page || 1) + 1,
                            data.meta.totalPages,
                          ),
                        }))
                      }
                      disabled={!data.meta.hasNextPage}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}

              {data?.data.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron movimientos para los filtros seleccionados
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
