# Módulo de Reportes Contables - Frontend

## 📊 Estado de Implementación

### ✅ Completado

- **Schemas** - Todos los tipos validados con Zod
- **Actions** - 5 server actions para consumir la API
- **Hooks** - 5 hooks de React Query
- **Query Keys** - Integrados en `lib/queryKeys.ts`
- **Componente Principal** - `AccountingReportsPage` con navegación por tabs
- **Libro Diario** - Componente completo y funcional

### 🚧 Por Completar

Los siguientes componentes están creados como stubs y necesitan implementación:

1. **Libro Mayor** (`general-ledger-report.tsx`)
2. **Balance de Comprobación** (`trial-balance-report.tsx`)
3. **Balance General** (`balance-sheet-report.tsx`)
4. **Estado de Resultados** (`income-statement-report.tsx`)

## 🎨 Guía de Implementación

### Patrón a Seguir

Usa `journal-book-report.tsx` como referencia. Todos los componentes deben seguir este patrón:

```tsx
'use client';

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
import { Download, Printer, Search } from 'lucide-react';
import { useState } from 'react';
import { useJournalBook } from '../hooks/use-accounting-reports';

export function JournalBookReport() {
  const { data: companyData } = useCompany();
  const { data: cyclesData } = useAccountingCycles();

  // Obtener la primera compañía del array
  const company = companyData?.data?.[0];

  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    search: '',
  });

  const { data, isLoading } = useJournalBook({
    accountingCycleId: selectedCycleId,
    companyId: company?.id?.toString() || '',
    ...filters,
    page: 1,
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

      {/* Reporte */}
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
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {data?.data.map((entry) => (
                <div
                  key={entry.entryId}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Cabecera del asiento */}
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

                  {/* Detalles del asiento */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Debe</TableHead>
                        <TableHead className="text-right">Haber</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entry.details.map((detail) => (
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
                      {/* Totales */}
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
```

## 📋 Especificaciones por Reporte

### 1. Libro Mayor (General Ledger)

**Hook:** `useGeneralLedger`

**Filtros:**

- Fecha Inicio / Fecha Fin
- Selector de Cuenta (dropdown con búsqueda)

**Estructura de Datos:**

```typescript
data.data[] // Array de cuentas
  - accountCode
  - accountName
  - initialBalance
  - entries[] // Movimientos
    - entryDate
    - description
    - debit
    - credit
    - balance (saldo corrido)
  - totalDebit
  - totalCredit
  - finalBalance
```

**Diseño:**

- Mostrar una sección por cuenta
- Tabla de movimientos con saldo corrido
- Totales al final de cada cuenta

### 2. Balance de Comprobación (Trial Balance)

**Hook:** `useTrialBalance`

**Filtros:**

- Fecha del Balance (date picker)
- Tipo de Cuenta (dropdown: Todos, Activo, Pasivo, etc.)

**Estructura de Datos:**

```typescript
data.accounts[] // Array de cuentas
  - accountCode
  - accountName
  - accountType
  - initialBalance
  - periodDebit
  - periodCredit
  - currentBalance

data.summary // Totales
  - totalInitialDebit
  - totalInitialCredit
  - totalPeriodDebit
  - totalPeriodCredit
  - totalCurrentDebit
  - totalCurrentCredit
```

**Diseño:**

- Tabla con columnas: Código, Cuenta, Tipo, Saldo Inicial, Debe, Haber, Saldo Final
- Fila de totales al final
- Mostrar Saldo Deudor y Saldo Acreedor en columnas separadas

### 3. Balance General (Balance Sheet)

**Hook:** `useBalanceSheet`

**Filtros:**

- Fecha del Balance
- Nivel de Detalle (1=resumen, 2=detallado, 3=completo)

**Estructura de Datos:**

```typescript
data.assets // Activos
  - accounts[]
  - total

data.liabilities // Pasivos
  - accounts[]
  - total

data.equity // Patrimonio
  - accounts[]
  - total

data.totals
  - totalAssets
  - totalLiabilities
  - totalEquity
  - totalLiabilitiesAndEquity
```

**Diseño:**

- Dos columnas: Activos | Pasivos + Patrimonio
- Jerarquía de cuentas con indentación
- Totales destacados
- Ecuación patrimonial al final

### 4. Estado de Resultados (Income Statement)

**Hook:** `useIncomeStatement`

**Filtros:**

- Fecha del Balance
- Nivel de Detalle

**Estructura de Datos:**

```typescript
data.revenue // Ingresos
  - accounts[]
  - total

data.expenses // Gastos
  - accounts[]
  - total

data.result
  - grossProfit
  - operatingIncome
  - netIncome
```

**Diseño:**

- Sección de Ingresos
- Sección de Gastos
- Cálculo de Utilidad/Pérdida
- Destacar el resultado neto

## 🎯 Funcionalidades Comunes

### Imprimir

```typescript
const handlePrint = () => {
  window.print();
};
```

### Exportar a Excel

```typescript
const handleExport = () => {
  // TODO: Implementar con librería como xlsx
  // Por ahora, solo log
  console.log('Exportar a Excel');
};
```

### Formateo de Números

```typescript
Number(value).toLocaleString('es-VE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
```

### Loading State

```typescript
{isLoading ? (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} className="h-20 w-full" />
    ))}
  </div>
) : (
  // Contenido
)}
```

### Empty State

```typescript
{data?.accounts.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    No se encontraron datos
  </div>
)}
```

## 🔧 Hooks Disponibles

Todos los hooks están en `hooks/use-accounting-reports.ts`:

```typescript
useJournalBook(params);
useGeneralLedger(params);
useTrialBalance(params);
useBalanceSheet(params);
useIncomeStatement(params);
```

## 📦 Componentes UI Disponibles

Todos desde `@repo/shadcn/`:

- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`
- `Input`, `Label`, `Button`
- `Skeleton`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`

## 🚀 Próximos Pasos

1. Implementar cada componente stub siguiendo el patrón
2. Agregar exportación a Excel (librería `xlsx`)
3. Agregar estilos de impresión CSS
4. Implementar paginación para reportes grandes
5. Agregar gráficos con `recharts` o similar

## 📝 Notas

- Todos los montos vienen como strings desde la API para evitar pérdida de precisión
- Usa `Number()` para convertir antes de formatear
- Los filtros son opcionales excepto `accountingCycleId`
- El `companyId` se obtiene del contexto global
