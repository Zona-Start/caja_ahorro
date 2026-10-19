import { useAccountingAccounts } from '@/features/accounting/accounting-accounts/hooks/use-accounting-accounts-query';
import { useAccountingCycles } from '@/features/accounting/accounting-cycles/hooks/use-accounting-cycles-query';
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
import { useAccountBalances } from '../hooks/use-accounting-reports-query';

const money = (value: string | number) =>
  Number(value).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function AccountBalanceReport() {
  const { data: cyclesData } = useAccountingCycles();
  const { data: accountsData } = useAccountingAccounts();

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState(1);

  const accountOptions = useMemo(
    () =>
      accountsData?.map((account: any) => ({
        value: account.id!.toString(),
        label: `${account.code} - ${account.name}`,
      })) || [],
    [accountsData],
  );

  const { data, isLoading } = useAccountBalances({
    accountingCycleId: selectedCycleId || undefined,
    accountPlanId: selectedAccountId || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const handleExport = () => {
    const params = new URLSearchParams();
    if (selectedCycleId) params.append('accountingCycleId', selectedCycleId);
    if (selectedAccountId) params.append('accountPlanId', selectedAccountId);
    if (search) params.append('search', search);
    window.open(
      `/accounting-reports/account-balances/pdf?${params.toString()}`,
      '_blank',
    );
  };

  const account = data?.account;
  const associates = data?.associates ?? [];

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
              <Label>Cuenta</Label>
              <SelectSearchable
                options={accountOptions}
                onValueChange={(value) => {
                  setSelectedAccountId(value || '');
                  setPage(1);
                }}
                placeholder="Buscar cuenta por código o nombre..."
                defaultValue={selectedAccountId}
              />
            </div>

            <div className="space-y-2">
              <Label>Buscar socio</Label>
              <Input
                placeholder="Cédula o nombre del socio..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Balance por Cuenta</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!selectedAccountId}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedAccountId ? (
            <div className="text-center py-12 text-muted-foreground">
              Seleccione una cuenta contable para ver el reporte
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !account ? (
            <div className="text-center py-12 text-muted-foreground">
              No se encontró información para la cuenta seleccionada
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-lg">
                      {account.accountCode} - {account.accountName}
                    </span>
                    <span className="ml-3 text-xs uppercase text-muted-foreground">
                      {account.accountNature === 'DEBIT'
                        ? 'Deudora'
                        : 'Acreedora'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium mr-2">
                      Saldo de la cuenta:
                    </span>
                    <span className="font-mono font-bold">
                      {money(account.balance)}
                    </span>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Debe</TableHead>
                      <TableHead className="text-right">Haber</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-bold">
                      <TableCell>Total de la cuenta</TableCell>
                      <TableCell className="text-right font-mono">
                        {money(account.totalDebit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {money(account.totalCredit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {money(account.balance)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {account.hasAssociateAuxiliary ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3">
                    <span className="font-bold text-sm uppercase text-muted-foreground">
                      Detalle por socio ({data?.meta.totalCount ?? 0})
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cédula</TableHead>
                        <TableHead>Asociado</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {associates.map((row) => (
                        <TableRow key={row.associateId}>
                          <TableCell className="font-mono">
                            {row.cedula}
                          </TableCell>
                          <TableCell>{row.fullname}</TableCell>
                          <TableCell className="text-right font-mono">
                            {money(row.totalDebit)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {money(row.totalCredit)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {money(row.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {associates.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-6"
                          >
                            No se encontraron socios para el filtro aplicado
                          </TableCell>
                        </TableRow>
                      )}
                      {data?.associatesTotal && (
                        <TableRow className="bg-muted/30 font-bold">
                          <TableCell colSpan={2} className="text-right">
                            Totales
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {money(data.associatesTotal.totalDebit)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {money(data.associatesTotal.totalCredit)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {money(data.associatesTotal.balance)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Esta cuenta no tiene auxiliar por socio.
                </div>
              )}

              {account.hasAssociateAuxiliary && data?.meta && (
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
                      Página {data.meta.page} de {data.meta.totalPages || 1}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
