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
import { cn } from '@repo/shadcn/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { SelectSearchable } from '@repo/shadcn/select-searchable';
import { Skeleton } from '@repo/shadcn/skeleton';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useBalanceSheet } from '../hooks/use-accounting-reports-query';
import { AccountingReportsService } from '../services/accounting-reports-service';
import { ReportDatePicker } from './report-date-picker';
import { ReportFiltersRequired } from './report-filters-required';

interface BalanceAccountForExcel {
  code: string;
  name: string;
  level: number;
  balance: string;
  children?: BalanceAccountForExcel[];
}

const flattenAccountsForExcel = (
  accounts: BalanceAccountForExcel[],
): BalanceAccountForExcel[] => {
  const result: BalanceAccountForExcel[] = [];
  for (const account of accounts) {
    result.push(account);
    if (account.children?.length) {
      result.push(...flattenAccountsForExcel(account.children));
    }
  }
  return result;
};

export function BalanceSheetReport() {
  const { data: cyclesData } = useAccountingCycles();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    detailLevel: '3',
  });

  const { data, isLoading } = useBalanceSheet({
    accountingCycleId: selectedCycleId,
    companyId: '1',
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    detailLevel: filters.detailLevel,
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
    if (filters.detailLevel) params.set('detailLevel', filters.detailLevel);
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
        `/accounting-reports/balance-sheet/pdf?${params.toString()}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `balance_general_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess('Balance General exportado a PDF');
    } catch (error) {
      showError({
        title: 'Error al exportar PDF',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF del Balance General.',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!hasRequiredFilters || exporting) return;

    setExporting('excel');
    try {
      const result = await AccountingReportsService.getBalanceSheet({
        accountingCycleId: selectedCycleId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        detailLevel: filters.detailLevel,
      });

      const rows: (string | number)[][] = [
        ['BALANCE GENERAL'],
        [
          'Ciclo',
          selectedCycle?.description ?? result.cycleInfo?.description ?? '',
        ],
        ['Rango', getFilterDateLabel()],
        ['Nivel de detalle', filters.detailLevel],
        [],
      ];

      const addSection = (
        title: string,
        accounts: any[],
        totalLabel: string,
        total: string,
      ) => {
        rows.push([title]);
        rows.push(['Código', 'Cuenta', 'Monto']);

        for (const account of flattenAccountsForExcel(accounts)) {
          rows.push([
            account.code,
            `${'  '.repeat(Math.max(0, account.level - 1))}${account.name}`,
            Number(account.balance) || 0,
          ]);
        }

        rows.push(['', totalLabel, Number(total) || 0]);
        rows.push([]);
      };

      addSection(
        'ACTIVOS',
        result.assets.accounts,
        'TOTAL ACTIVOS',
        result.totals.totalAssets,
      );
      addSection(
        'PASIVOS',
        result.liabilities.accounts,
        'TOTAL PASIVOS',
        result.totals.totalLiabilities,
      );
      addSection(
        'PATRIMONIO',
        result.equity.accounts,
        'TOTAL PATRIMONIO',
        result.totals.totalEquity,
      );

      rows.push([
        '',
        'TOTAL PASIVO + PATRIMONIO',
        Number(result.totals.totalLiabilitiesAndEquity) || 0,
      ]);

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [{ wch: 18 }, { wch: 60 }, { wch: 18 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance General');
      XLSX.writeFile(
        workbook,
        `balance_general_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      showSuccess('Balance General exportado a Excel');
    } catch (error) {
      showError({
        title: 'Error al exportar Excel',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el Excel del Balance General.',
      });
    } finally {
      setExporting(null);
    }
  };

  const isExporting = exporting !== null;

  const renderAccount = (account: any) => {
    return (
      <Fragment key={account.accountCode}>
        <div className="flex items-start justify-between gap-4 py-1 border-b border-muted/50 last:border-0 hover:bg-muted/20">
          <div
            className={cn('flex min-w-0 flex-1 items-start gap-3', {
              'font-bold': account.level <= 2,
            })}
          >
            <span className="w-32 shrink-0 whitespace-nowrap font-mono text-[11px] text-muted-foreground opacity-70 sm:w-36 sm:text-xs">
              {account.code}
            </span>
            <span
              className={cn('min-w-0 break-words', {
                'pl-2': account.level === 2,
                'pl-4': account.level === 3,
                'pl-6': account.level === 4,
                'pl-8': account.level >= 5,
              })}
            >
              {account.name}
            </span>
          </div>
          <div
            className={cn('font-mono shrink-0 text-right', {
              'font-bold': account.level <= 2,
            })}
          >
            {Number(account.balance).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        {account.children && account.children.length > 0 && (
          <div className="pl-0">
            {account.children.map((child: any) => renderAccount(child))}
          </div>
        )}
      </Fragment>
    );
  };

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
              <Label htmlFor="level">Nivel de Detalle</Label>
              <Select
                value={filters.detailLevel}
                onValueChange={(value) =>
                  setFilters({ ...filters, detailLevel: value })
                }
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Seleccione nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Resumen (Nivel 1)</SelectItem>
                  <SelectItem value="2">Detallado (Nivel 2)</SelectItem>
                  <SelectItem value="3">Completo (Nivel 3+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance General</CardTitle>
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
          ) : data ? (
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="border-b-2 border-primary pb-2">
                  <h3 className="text-xl font-bold text-primary">
                    {data.assets.title}
                  </h3>
                </div>
                <div className="border rounded-lg p-4 bg-card/50">
                  {data.assets.accounts.map((account: any) =>
                    renderAccount(account),
                  )}
                </div>
                <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg border font-bold text-lg">
                  <span>Total Activos</span>
                  <span>
                    {Number(data.totals.totalAssets).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </section>

              <section className="space-y-4">
                <div className="border-b-2 border-orange-500 pb-2">
                  <h3 className="text-xl font-bold text-orange-500">
                    {data.liabilities.title}
                  </h3>
                </div>
                <div className="border rounded-lg p-4 bg-card/50">
                  {data.liabilities.accounts.map((account: any) =>
                    renderAccount(account),
                  )}
                </div>
                <div className="flex justify-between items-center py-2 px-4 bg-orange-500/10 rounded-lg border border-orange-200 font-bold">
                  <span>Total Pasivos</span>
                  <span>
                    {Number(data.totals.totalLiabilities).toLocaleString(
                      'es-VE',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </span>
                </div>
              </section>

              <section className="space-y-4">
                <div className="border-b-2 border-green-500 pb-2">
                  <h3 className="text-xl font-bold text-green-500">
                    {data.equity.title}
                  </h3>
                </div>
                <div className="border rounded-lg p-4 bg-card/50">
                  {data.equity.accounts.map((account: any) =>
                    renderAccount(account),
                  )}
                </div>
                <div className="flex justify-between items-center py-2 px-4 bg-green-500/10 rounded-lg border border-green-200 font-bold">
                  <span>Total Patrimonio</span>
                  <span>
                    {Number(data.totals.totalEquity).toLocaleString('es-VE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </section>

              <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg border font-bold text-lg">
                <span>Total Pasivo + Patrimonio</span>
                <span>
                  {Number(data.totals.totalLiabilitiesAndEquity).toLocaleString(
                    'es-VE',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    },
                  )}
                </span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
