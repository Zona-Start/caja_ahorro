import { useAccountingCycles } from '@/features/accounting-cycles/hooks/use-accounting-cycles-query';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Label } from '@repo/shadcn/label';
import { cn } from '@repo/shadcn/utils';
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
import { useBalanceSheet } from '../hooks/use-accounting-reports-query';

export function BalanceSheetReport() {
  const { data: cyclesData } = useAccountingCycles();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    detailLevel: '3',
  });

  const { data, isLoading } = useBalanceSheet({
    accountingCycleId: selectedCycleId,
    companyId: '1',
    ...filters,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    console.log('Exportar a Excel');
  };

  const renderAccount = (account: any) => {
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
            {account.children.map((child: any) =>
              renderAccount(child),
            )}
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance General</CardTitle>
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="border-b-2 border-primary pb-2">
                      <h3 className="text-xl font-bold text-primary">
                        {data.assets.title}
                      </h3>
                    </div>
                    <div className="border rounded-lg p-4 bg-card/50 min-h-[400px]">
                      {data.assets.accounts.map((account: any) =>
                        renderAccount(account),
                      )}
                    </div>
                    <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg border font-bold text-lg">
                      <span>Total Activos</span>
                      <span>
                        {Number(data.totals.totalAssets).toLocaleString(
                          'es-VE',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
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
                    </div>

                    <div className="space-y-4">
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
                          {Number(data.totals.totalEquity).toLocaleString(
                            'es-VE',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-lg border font-bold text-lg mt-4">
                      <span>Total Pasivo + Patrimonio</span>
                      <span>
                        {Number(
                          data.totals.totalLiabilitiesAndEquity,
                        ).toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
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
