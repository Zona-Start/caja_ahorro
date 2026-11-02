import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
import { useToastSystem } from '@/hooks/use-toast-system';
import { apiClient } from '@/lib/api-client';
import { Button } from '@repo/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/shadcn/card';
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
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useSudecaReport } from '../hooks/use-sudeca-query';
import type { SudecaReportType } from '../schemas/sudeca.schema';

const TITLES: Record<SudecaReportType, string> = {
  'financial-situation': 'Situación Financiera',
  'income-statement': 'Estado de Resultado',
  'trial-balance': 'Balance de Comprobación',
};

const money = (value?: string) =>
  Number(value ?? 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const QUARTERS = [
  { value: '1', label: 'Trimestre 1' },
  { value: '2', label: 'Trimestre 2' },
  { value: '3', label: 'Trimestre 3' },
  { value: '4', label: 'Trimestre 4' },
];

export function SudecaReport({ type }: { type: SudecaReportType }) {
  const { data: cyclesData } = useAccountingCycles();
  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [quarter, setQuarter] = useState('1');
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const { error: showError, success: showSuccess } = useToastSystem();

  const params = {
    accountingCycleId: selectedCycleId,
    quarter: Number(quarter),
  };
  const { data, isLoading } = useSudecaReport(type, params);

  const isTrialBalance = type === 'trial-balance';
  const hasRequiredFilters = !!selectedCycleId && !!quarter;
  const isExporting = exporting !== null;

  const handleExportPdf = async () => {
    if (!hasRequiredFilters || !data || isExporting) return;

    setExporting('pdf');
    try {
      const query = new URLSearchParams({
        accountingCycleId: selectedCycleId,
        quarter,
      });
      const response = await apiClient.get(
        `/accounting-reports/sudeca/${type}/pdf?${query.toString()}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sudeca_${type}_T${quarter}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess('Reporte Sudeca exportado a PDF');
    } catch (error) {
      showError({
        title: 'Error al exportar PDF',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF del reporte Sudeca.',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    if (!hasRequiredFilters || !data || isExporting) return;

    try {
      const header = isTrialBalance
        ? [
            'Código',
            'Descripción de la cuenta',
            'Anterior',
            'Débitos',
            'Créditos',
            'Actual',
          ]
        : [
            'Código',
            'Descripción de la cuenta',
            'Trimestre Anterior',
            'Trimestre Actual',
            'Variación',
          ];

      const rows: (string | number)[][] = [
        [`${data.title} TRIMESTRAL A: ${data.quarterLabel}`],
        ['SECTOR: PRIVADO', 'NUMERO DE REGISTRO: 0'],
        [],
        header,
        ...data.rows.map((row) =>
          isTrialBalance
            ? [
                row.accountCode,
                row.accountName,
                Number(row.previous) || 0,
                Number(row.debit) || 0,
                Number(row.credit) || 0,
                Number(row.current) || 0,
              ]
            : [
                row.accountCode,
                row.accountName,
                Number(row.previous) || 0,
                Number(row.current) || 0,
                Number(row.variation) || 0,
              ],
        ),
      ];

      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      worksheet['!cols'] = isTrialBalance
        ? [
            { wch: 20 },
            { wch: 50 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
            { wch: 16 },
          ]
        : [{ wch: 20 }, { wch: 50 }, { wch: 18 }, { wch: 18 }, { wch: 16 }];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        TITLES[type].slice(0, 31),
      );
      XLSX.writeFile(
        workbook,
        `sudeca_${type}_T${quarter}_${new Date().toISOString().split('T')[0]}.xlsx`,
      );

      showSuccess('Reporte Sudeca exportado a Excel');
    } catch (error) {
      showError({
        title: 'Error al exportar Excel',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el Excel del reporte Sudeca.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Ciclo Contable</Label>
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
              <Label>Trimestre</Label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione el trimestre" />
                </SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{data?.title ?? TITLES[type]}</CardTitle>
            {data && (
              <CardDescription>
                Trimestre actual: {data.quarterLabel} · Trimestre anterior:{' '}
                {data.previousQuarterLabel}
              </CardDescription>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasRequiredFilters || !data || isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? 'Generando...' : 'Exportar'}
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
            <div className="text-center py-12 text-muted-foreground">
              Seleccione el ciclo contable y el trimestre para ver el reporte
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontró información para el trimestre seleccionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción de la cuenta</TableHead>
                    {isTrialBalance ? (
                      <>
                        <TableHead className="text-right">Anterior</TableHead>
                        <TableHead className="text-right">Débitos</TableHead>
                        <TableHead className="text-right">Créditos</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="text-right">
                          Trimestre Anterior
                        </TableHead>
                        <TableHead className="text-right">
                          Trimestre Actual
                        </TableHead>
                        <TableHead className="text-right">Variación</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isTrialBalance ? 6 : 5}
                        className="text-center text-muted-foreground py-10"
                      >
                        No se encontraron cuentas con movimientos para el
                        trimestre seleccionado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.rows.map((row) => (
                      <TableRow key={row.accountCode}>
                        <TableCell className="font-mono text-xs align-top">
                          {row.accountCode}
                        </TableCell>
                        <TableCell className="align-top">
                          <span className="break-words">{row.accountName}</span>
                        </TableCell>
                        {isTrialBalance ? (
                          <>
                            <TableCell className="text-right font-mono align-top">
                              {money(row.previous)}
                            </TableCell>
                            <TableCell className="text-right font-mono align-top">
                              {money(row.debit)}
                            </TableCell>
                            <TableCell className="text-right font-mono align-top">
                              {money(row.credit)}
                            </TableCell>
                            <TableCell className="text-right font-mono align-top font-semibold">
                              {money(row.current)}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="text-right font-mono align-top">
                              {money(row.previous)}
                            </TableCell>
                            <TableCell className="text-right font-mono align-top">
                              {money(row.current)}
                            </TableCell>
                            <TableCell className="text-right font-mono align-top">
                              {money(row.variation)}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
