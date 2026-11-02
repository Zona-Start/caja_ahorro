import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { apiClient } from '@/lib/api-client';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/shadcn/dropdown-menu';
import { Label } from '@repo/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useTrialBalance } from '../hooks/use-accounting-reports-query';
import { AccountingReportsService } from '../services/accounting-reports-service';
import { ReportDatePicker } from './report-date-picker';
import { ReportFiltersRequired } from './report-filters-required';
import { columns } from './tables/trial-balance-columns';

export function TrialBalanceReport() {
  const { data: cyclesData } = useAccountingCycles();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    onlyWithMovements: 'true',
  });

  const { data, isLoading } = useTrialBalance({
    accountingCycleId: selectedCycleId,
    companyId: '1',
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    onlyWithMovements: filters.onlyWithMovements,
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
    params.set('onlyWithMovements', filters.onlyWithMovements);
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
        `/accounting-reports/trial-balance/pdf?${params.toString()}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `balance_comprobacion_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess('Balance de Comprobación exportado a PDF');
    } catch (error) {
      showError({
        title: 'Error al exportar PDF',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF del Balance de Comprobación.',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!hasRequiredFilters || exporting) return;

    setExporting('excel');
    try {
      const result = await AccountingReportsService.getTrialBalance({
        accountingCycleId: selectedCycleId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        onlyWithMovements: filters.onlyWithMovements,
      });

      const difference = (debit: string, credit: string) =>
        (Number(debit) - Number(credit)).toFixed(2);

      const rows: (string | number)[][] = [
        ['BALANCE DE COMPROBACIÓN'],
        [
          'Ciclo',
          selectedCycle?.description ?? result.cycleInfo?.description ?? '',
        ],
        ['Rango', getFilterDateLabel()],
        [
          'Movimientos',
          filters.onlyWithMovements === 'true'
            ? 'Con movimientos'
            : 'Todas las cuentas',
        ],
        [],
        [
          'Código',
          'Cuenta',
          'Tipo',
          'Naturaleza',
          'Saldo Inicial',
          'Debe Periodo',
          'Haber Periodo',
          'Saldo Actual',
        ],
      ];

      for (const account of result.accounts) {
        rows.push([
          account.accountCode,
          account.accountName,
          account.accountType,
          account.accountNature === 'DEBIT' ? 'Deudora' : 'Acreedora',
          Number(account.initialBalance) || 0,
          Number(account.periodDebit) || 0,
          Number(account.periodCredit) || 0,
          Number(account.currentBalance) || 0,
        ]);
      }

      rows.push(
        [],
        ['RESUMEN'],
        ['', 'Débitos', 'Créditos', 'Diferencia'],
        [
          'Saldos Iniciales',
          Number(result.summary.totalInitialDebit) || 0,
          Number(result.summary.totalInitialCredit) || 0,
          Number(
            difference(
              result.summary.totalInitialDebit,
              result.summary.totalInitialCredit,
            ),
          ) || 0,
        ],
        [
          'Movimientos del Periodo',
          Number(result.summary.totalPeriodDebit) || 0,
          Number(result.summary.totalPeriodCredit) || 0,
          Number(
            difference(
              result.summary.totalPeriodDebit,
              result.summary.totalPeriodCredit,
            ),
          ) || 0,
        ],
        [
          'Saldos Actuales',
          Number(result.summary.totalCurrentDebit) || 0,
          Number(result.summary.totalCurrentCredit) || 0,
          Number(
            difference(
              result.summary.totalCurrentDebit,
              result.summary.totalCurrentCredit,
            ),
          ) || 0,
        ],
      );

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 40 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Comprobación');
      XLSX.writeFile(
        workbook,
        `balance_comprobacion_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      showSuccess('Balance de Comprobación exportado a Excel');
    } catch (error) {
      showError({
        title: 'Error al exportar Excel',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el Excel del Balance de Comprobación.',
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
              <Label htmlFor="startDate">Desde</Label>
              <ReportDatePicker
                id="startDate"
                value={filters.startDate}
                onChange={(value) =>
                  setFilters({ ...filters, startDate: value })
                }
                placeholder="Seleccionar fecha desde"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Hasta</Label>
              <ReportDatePicker
                id="endDate"
                value={filters.endDate}
                onChange={(value) => setFilters({ ...filters, endDate: value })}
                placeholder="Seleccionar fecha hasta"
                minDate={
                  filters.startDate
                    ? new Date(`${filters.startDate}T12:00:00`)
                    : undefined
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movements">Movimientos</Label>
              <Select
                value={filters.onlyWithMovements}
                onValueChange={(value) =>
                  setFilters({ ...filters, onlyWithMovements: value })
                }
              >
                <SelectTrigger id="movements">
                  <SelectValue placeholder="Filtrar movimientos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Con Movimientos</SelectItem>
                  <SelectItem value="false">Todas las cuentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance de Comprobación</CardTitle>
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
            <DataTableSkeleton columnCount={6} rowCount={10} />
          ) : data ? (
            <div className="space-y-6">
              <DataTable
                columns={columns}
                data={data.accounts}
                totalItems={data.accounts.length}
                manualPagination={false}
              />

              <div className="border rounded-lg p-4 bg-muted/50 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Total Débito Inicial
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {Number(data.summary.totalInitialDebit).toLocaleString(
                        'es-VE',
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Total Crédito Inicial
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {Number(data.summary.totalInitialCredit).toLocaleString(
                        'es-VE',
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Total Débito Periodo
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {Number(data.summary.totalPeriodDebit).toLocaleString(
                        'es-VE',
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">
                      Total Crédito Periodo
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {Number(data.summary.totalPeriodCredit).toLocaleString(
                        'es-VE',
                        { minimumFractionDigits: 2 },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
