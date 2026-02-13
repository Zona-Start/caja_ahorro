'use client';

import { useAccountingAccounts } from '@/feactures/accounting/accounting-accounts/hooks/use-query-account-plan';
import { useAccountingCycles } from '@/feactures/accounting/accounting-cycles/hooks/use-query-accounting-cycle';
import { useCompany } from '@/feactures/configurations/company/hooks/use-company';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
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
import { Download, Printer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useGeneralLedger } from '../hooks/use-accounting-reports';

export function GeneralLedgerReport() {
  const { data: companyData } = useCompany();
  const { data: cyclesData } = useAccountingCycles();
  const { data: accountsData } = useAccountingAccounts();

  // Obtener la primera compañía del array
  const company = companyData?.data?.[0];

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    accountPlanId: '',
    page: 1,
  });

  const accountOptions = useMemo(() => {
    return (
      accountsData?.data?.map((account) => ({
        value: account.id!.toString(),
        label: `${account.code} - ${account.name}`,
      })) || []
    );
  }, [accountsData]);

  const { data, isLoading } = useGeneralLedger({
    accountingCycleId: selectedCycleId,
    companyId: company?.id?.toString() || '',
    ...filters,
    limit: 50,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel');
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle">Ciclo Contable</Label>
              <SelectSearchable
                options={
                  cyclesData?.data?.map((cycle) => ({
                    value: cycle.id!.toString(),
                    label: cycle.description,
                  })) || []
                }
                onValueChange={(value) => setSelectedCycleId(value || '')}
                placeholder="Seleccione un ciclo"
                defaultValue={selectedCycleId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  setFilters({ ...filters, startDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) =>
                  setFilters({ ...filters, endDate: e.target.value })
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

      {/* Reporte */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Libro Mayor</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
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
              {data?.data.map((account) => (
                <div
                  key={account.accountPlanId}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Cabecera de la cuenta */}
                  <div className="bg-muted/50 px-4 py-3 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-lg">
                        {account.accountCode} - {account.accountName}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium mr-2">
                        Saldo Inicial:
                      </span>
                      <span className="font-mono">
                        {Number(account.initialBalance).toLocaleString(
                          'es-VE',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Movimientos */}
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
                      {account.entries.map((entry) => (
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
                      {/* Totales de la cuenta */}
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
