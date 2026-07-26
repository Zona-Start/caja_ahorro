import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
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
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { useAssociatesBalance } from '../hooks/use-accounting-reports-query';

export function AssociatesBalanceReport() {
  const { data: cyclesData } = useAccountingCycles();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAssociatesBalance({
    accountingCycleId: selectedCycleId,
    page,
    limit: 20,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const pdfUrl = `/accounting-reports/associates-balance/pdf?accountingCycleId=${selectedCycleId}`;
    window.open(pdfUrl, '_blank');
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance de Asociados</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!selectedCycleId}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
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
                  No se encontraron movimientos para el ciclo seleccionado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
