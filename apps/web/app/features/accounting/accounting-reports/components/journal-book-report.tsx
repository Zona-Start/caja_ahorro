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
import { Input } from '@repo/shadcn/input';
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
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useJournalBook } from '../hooks/use-accounting-reports-query';
import { AccountingReportsService } from '../services/accounting-reports-service';
import { ReportDatePicker } from './report-date-picker';
import { ReportFiltersRequired } from './report-filters-required';

export function JournalBookReport() {
  const { data: cyclesData } = useAccountingCycles();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: '',
  });

  const { data, isLoading } = useJournalBook({
    accountingCycleId: selectedCycleId,
    companyId: '1', // Hardcoded company ID for now
    ...filters,
    page: 1,
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
    if (filters.search) params.set('search', filters.search);
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
        `/accounting-reports/journal-book/pdf?${params.toString()}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `libro_diario_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess('Libro Diario exportado a PDF');
    } catch (error) {
      showError({
        title: 'Error al exportar PDF',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF del Libro Diario.',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!hasRequiredFilters || exporting) return;

    setExporting('excel');
    try {
      const result = await AccountingReportsService.getJournalBook({
        accountingCycleId: selectedCycleId,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
        page: 1,
        limit: 10000,
      });

      const rows: (string | number)[][] = [
        ['LIBRO DIARIO'],
        ['Ciclo', selectedCycle?.description ?? ''],
        ['Rango', getFilterDateLabel()],
      ];

      if (filters.search) rows.push(['Búsqueda', filters.search]);

      rows.push(
        [],
        [
          'Comprobante',
          'Fecha',
          'Descripción',
          'Cuenta',
          'Nombre de Cuenta',
          'Descripción Detalle',
          'Debe',
          'Haber',
        ],
      );

      for (const entry of result.data) {
        for (const detail of entry.details) {
          rows.push([
            entry.voucherNo ?? entry.entryId.slice(0, 8),
            formatDbDate(entry.entryDate),
            entry.description,
            detail.accountCode,
            detail.accountName,
            detail.description ?? '',
            Number(detail.debit) || 0,
            Number(detail.credit) || 0,
          ]);
        }

        rows.push([
          entry.voucherNo ?? entry.entryId.slice(0, 8),
          formatDbDate(entry.entryDate),
          entry.description,
          '',
          '',
          'TOTALES',
          Number(entry.totalDebit) || 0,
          Number(entry.totalCredit) || 0,
        ]);
      }

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = [
        { wch: 14 },
        { wch: 12 },
        { wch: 35 },
        { wch: 18 },
        { wch: 35 },
        { wch: 35 },
        { wch: 14 },
        { wch: 14 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Libro Diario');
      XLSX.writeFile(
        workbook,
        `libro_diario_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      showSuccess('Libro Diario exportado a Excel');
    } catch (error) {
      showError({
        title: 'Error al exportar Excel',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el Excel del Libro Diario.',
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
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Libro Diario</CardTitle>
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
              {data?.data.map((entry: any) => (
                <div
                  key={entry.entryId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fecha:</span>{' '}
                      {formatDbDate(entry.entryDate)}
                    </div>
                    <div>
                      <span className="font-medium">Asiento:</span>{' '}
                      {entry.voucherNo ?? entry.entryId.slice(0, 8)}
                    </div>
                    <div>
                      <span className="font-medium">Descripción:</span>{' '}
                      {entry.description}
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.details.map((detail: any) => (
                        <TableRow key={detail.detailId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {detail.accountCode}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {detail.accountName}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(detail.debit) > 0
                              ? Number(detail.debit).toLocaleString('es-VE', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(detail.credit) > 0
                              ? Number(detail.credit).toLocaleString('es-VE', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : ''}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-muted/30">
                        <TableCell>Totales</TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(entry.totalDebit).toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(entry.totalCredit).toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ))}

              {data?.data.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No se encontraron asientos contables
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
