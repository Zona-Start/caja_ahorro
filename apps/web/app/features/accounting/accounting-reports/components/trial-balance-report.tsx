import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
import { Button } from '@repo/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/shadcn/card';
import { Input } from '@repo/shadcn/input';
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
import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { useTrialBalance } from '../hooks/use-accounting-reports-query';
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

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedCycleId) params.append('accountingCycleId', selectedCycleId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.onlyWithMovements)
      params.append('onlyWithMovements', filters.onlyWithMovements);
    window.open(
      `/accounting-reports/trial-balance/pdf?${params.toString()}`,
      '_blank',
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
              <Label htmlFor="startDate">Desde</Label>
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
              <Label htmlFor="endDate">Hasta</Label>
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!hasRequiredFilters}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasRequiredFilters ? (
            <div className="text-center py-12 text-muted-foreground">
              Seleccione el ciclo contable y el rango de fechas (desde / hasta)
              para ver el reporte
            </div>
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
