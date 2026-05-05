import { useAccountingCycles } from '@/features/accounting-cycles/hooks/use-accounting-cycles-query';
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
import { Download, Printer, Search } from 'lucide-react';
import { useState } from 'react';
import { useJournalBook } from '../hooks/use-accounting-reports-query';

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

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    console.log('Exportar a Excel');
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
              {data?.data.map((entry: any) => (
                <div
                  key={entry.entryId}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3 grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Fecha:</span>{' '}
                      {new Date(entry.entryDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Asiento:</span>{' '}
                      {entry.entryId}
                    </div>
                    <div>
                      <span className="font-medium">Referencia:</span>{' '}
                      {entry.originReferenceId || 'N/A'}
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
