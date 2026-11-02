import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
import { AssociateSearchSelect } from '@/features/savings/partners/associates/components/associate-search-select';
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
import { useAssociatesBalance } from '../hooks/use-accounting-reports-query';

export function AssociatesBalanceReport() {
  const { data: cyclesData } = useAccountingCycles();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const {
    error: showError,
    success: showSuccess,
    info: showInfo,
  } = useToastSystem();

  const { data, isLoading } = useAssociatesBalance({
    accountingCycleId: selectedCycleId,
    associateId: selectedAssociateId || undefined,
    page,
    limit: 20,
  });

  const handleExportPdf = async () => {
    if (!selectedCycleId || isExporting) return;

    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('accountingCycleId', selectedCycleId);
      if (selectedAssociateId) params.set('associateId', selectedAssociateId);

      const response = await apiClient.get(
        `/accounting-reports/associates-balance/pdf?${params.toString()}`,
        { responseType: 'blob' },
      );

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `balance_asociados_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showSuccess('Balance de Asociados exportado a PDF');
    } catch (error) {
      showError({
        title: 'Error al exportar PDF',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo generar el PDF del Balance de Asociados.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    showInfo({
      title: 'Excel en construcción',
      description:
        'El reporte en Excel del Balance de Asociados estará disponible próximamente.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Ciclo Contable</Label>
              <SelectSearchable
                options={
                  cyclesData?.map((cycle: any) => ({
                    value: cycle.id!.toString(),
                    label: cycle.description,
                  })) || []
                }
                onValueChange={(value) => {
                  setSelectedCycleId(value || '');
                  setPage(1);
                }}
                placeholder="Seleccione un ciclo"
                defaultValue={selectedCycleId}
              />
            </div>

            <div className="space-y-2">
              <Label>Asociado</Label>
              <AssociateSearchSelect
                onSelect={(associate) => {
                  setSelectedAssociateId(associate?.id || '');
                  setPage(1);
                }}
                placeholder="Buscar asociado por cédula o nombre..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance de Asociados</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={!selectedCycleId || isExporting}
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
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {!selectedCycleId ? (
            <div className="text-center py-12 text-muted-foreground">
              Seleccione un ciclo contable para ver el reporte
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {data?.data.map((assoc: any) => (
                <div
                  key={assoc.associateId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold">
                        {assoc.cedula} - {assoc.fullname}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium mr-2">
                        Balance Total:
                      </span>
                      <span className="font-mono font-bold">
                        {Number(assoc.totalBalance).toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assoc.accounts.map((account: any) => (
                        <TableRow key={account.accountPlanId}>
                          <TableCell className="font-medium">
                            {account.accountCode}
                          </TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(account.totalDebit) > 0
                              ? Number(account.totalDebit).toLocaleString(
                                  'es-VE',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )
                              : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(account.totalCredit) > 0
                              ? Number(account.totalCredit).toLocaleString(
                                  'es-VE',
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  },
                                )
                              : ''}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {Number(account.balance).toLocaleString('es-VE', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
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
                      onClick={() => setPage(Math.max(page - 1, 1))}
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
                      onClick={() => setPage(page + 1)}
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
