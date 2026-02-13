'use client';

import { useAccountingCycles } from '@/feactures/accounting/accounting-cycles/hooks/use-query-accounting-cycle';
import { useCompany } from '@/feactures/configurations/company/hooks/use-company';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
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
import { Download, Printer } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useIncomeStatement } from '../hooks/use-accounting-reports';
import { IncomeStatementAccount } from '../schemas/income-statement.schema';

export function IncomeStatementReport() {
  const { data: companyData } = useCompany();
  const { data: cyclesData } = useAccountingCycles();

  // Obtener la primera compañía del array
  const company = companyData?.data?.[0];

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    detailLevel: '3',
  });

  const { data, isLoading } = useIncomeStatement({
    accountingCycleId: selectedCycleId,
    companyId: company?.id?.toString() || '',
    ...filters,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // TODO: Implementar exportación a Excel
    console.log('Exportar a Excel');
  };

  // Renderizado recursivo de cuentas
  const renderAccount = (account: IncomeStatementAccount) => {
    return (
      <Fragment key={account.accountCode}>
        <div className="flex justify-between py-1 border-b border-muted/50 last:border-0 hover:bg-muted/20">
          <div
            className={cn('flex items-center gap-2', {
              'font-bold': account.level <= 2,
              'pl-2': account.level === 2,
              'pl-4': account.level === 3,
              'pl-6': account.level === 4,
              'pl-8': account.level >= 5,
            })}
          >
            <span className="text-muted-foreground text-xs font-mono w-16 opacity-70">
              {account.accountCode}
            </span>
            <span className="truncate max-w-[200px] md:max-w-[300px]">
              {account.accountName}
            </span>
          </div>
          <div className={cn('font-mono', { 'font-bold': account.level <= 2 })}>
            {Number(account.balance).toLocaleString('es-VE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        {account.children && account.children.length > 0 && (
          <div className="pl-0">
            {account.children.map((child: IncomeStatementAccount) =>
              renderAccount(child),
            )}
          </div>
        )}
      </Fragment>
    );
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

      {/* Reporte */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Estado de Resultados</CardTitle>
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
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {data ? (
                <div className="space-y-8">
                  {/* INGRESOS */}
                  <div className="space-y-4">
                    <div className="border-b-2 border-primary pb-2">
                      <h3 className="text-xl font-bold text-primary">
                        {data.revenue.title}
                      </h3>
                    </div>
                    <div className="border rounded-lg p-4 bg-card/50">
                      {data.revenue.accounts.map((account) =>
                        renderAccount(account),
                      )}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg border font-bold text-lg">
                      <span>Total Ingresos</span>
                      <span>
                        {Number(data.revenue.total).toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* EGRESOS */}
                  <div className="space-y-4">
                    <div className="border-b-2 border-orange-500 pb-2">
                      <h3 className="text-xl font-bold text-orange-500">
                        {data.expenses.title}
                      </h3>
                    </div>
                    <div className="border rounded-lg p-4 bg-card/50">
                      {data.expenses.accounts.map((account) =>
                        renderAccount(account),
                      )}
                    </div>
                    <div className="flex justify-between items-center py-2 px-4 bg-orange-500/10 rounded-lg border border-orange-200 font-bold">
                      <span>Total Egresos</span>
                      <span>
                        {Number(data.expenses.total).toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* RESULTADOS */}
                  <div className="space-y-4 mt-8 pt-8 border-t">
                    <h3 className="text-xl font-bold mb-4">
                      Resultados del Ejercicio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-muted/30">
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Utilidad Bruta
                          </div>
                          <div className="text-2xl font-bold font-mono">
                            {Number(data.result.grossProfit).toLocaleString(
                              'es-VE',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-muted/30">
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Utilidad Operativa
                          </div>
                          <div className="text-2xl font-bold font-mono">
                            {Number(data.result.operatingIncome).toLocaleString(
                              'es-VE',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className={cn('bg-primary/10 border-primary/50', {
                          'bg-red-100 border-red-500':
                            Number(data.result.netIncome) < 0,
                          'bg-green-100 border-green-500':
                            Number(data.result.netIncome) > 0,
                        })}
                      >
                        <CardContent className="pt-6">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Utilidad/Pérdida Neta
                          </div>
                          <div
                            className={cn('text-3xl font-bold font-mono', {
                              'text-red-700': Number(data.result.netIncome) < 0,
                              'text-green-700':
                                Number(data.result.netIncome) > 0,
                            })}
                          >
                            {Number(data.result.netIncome).toLocaleString(
                              'es-VE',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Seleccione un ciclo contable para ver el reporte
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
