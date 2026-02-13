# Módulo de Reportes Contables (Accounting Reports)

Este módulo proporciona endpoints optimizados para generar los principales reportes contables requeridos por la caja de ahorro.

## 📊 Reportes Disponibles

### 1. Libro Diario (Journal Book)

**Endpoint:** `GET /accounting-reports/journal-book`

Muestra todos los asientos contables en orden cronológico con sus detalles de débito y crédito.

**Parámetros:**

- `accountingCycleId` - ID del ciclo contable
- `companyId` - ID de la compañía
- `startDate` - Fecha inicial (YYYY-MM-DD)
- `endDate` - Fecha final (YYYY-MM-DD)
- `status` - Estado del asiento (DRAFT, POSTED, CANCELLED)
- `originType` - Tipo de origen del asiento
- `search` - Búsqueda en descripción o referencia
- `page`, `limit` - Paginación

**Respuesta:**

```typescript
{
  data: [
    {
      entryId: number,
      entryDate: string,
      description: string,
      originType: string,
      status: string,
      details: [
        {
          accountCode: string,
          accountName: string,
          debit: string,
          credit: string
        }
      ],
      totalDebit: string,
      totalCredit: string
    }
  ],
  meta: { page, limit, totalCount, ... }
}
```

### 2. Libro Mayor (General Ledger)

**Endpoint:** `GET /accounting-reports/general-ledger`

Muestra los movimientos detallados de cuentas específicas con saldo corrido.

**Parámetros:**

- `accountingCycleId` - **Requerido** - ID del ciclo contable
- `companyId` - ID de la compañía
- `accountPlanId` - ID de cuenta específica
- `accountCode` - Código de cuenta (búsqueda parcial)
- `startDate` - Fecha inicial
- `endDate` - Fecha final
- `page`, `limit` - Paginación

**Respuesta:**

```typescript
{
  data: [
    {
      accountPlanId: number,
      accountCode: string,
      accountName: string,
      accountNature: string,
      initialBalance: string,
      totalDebit: string,
      totalCredit: string,
      finalBalance: string,
      entries: [
        {
          entryId: number,
          entryDate: string,
          description: string,
          debit: string,
          credit: string,
          balance: string  // Saldo corrido
        }
      ]
    }
  ],
  meta: { ... }
}
```

### 3. Balance de Comprobación (Trial Balance)

**Endpoint:** `GET /accounting-reports/trial-balance`

Muestra saldos iniciales, movimientos del período y saldos finales de todas las cuentas.

**Parámetros:**

- `accountingCycleId` - **Requerido** - ID del ciclo contable
- `companyId` - ID de la compañía
- `level` - Nivel de cuenta (1, 2, 3, etc.)
- `onlyWithMovements` - 'true' para mostrar solo cuentas con movimientos

**Respuesta:**

```typescript
{
  accounts: [
    {
      accountCode: string,
      accountName: string,
      accountType: string,
      accountNature: string,
      level: number,
      initialBalance: string,
      periodDebit: string,
      periodCredit: string,
      currentBalance: string
    }
  ],
  summary: {
    totalInitialDebit: string,
    totalInitialCredit: string,
    totalPeriodDebit: string,
    totalPeriodCredit: string,
    totalCurrentDebit: string,
    totalCurrentCredit: string
  },
  cycleInfo: { ... }
}
```

### 4. Balance General (Balance Sheet)

**Endpoint:** `GET /accounting-reports/balance-sheet`

Muestra la situación financiera: Activos, Pasivos y Patrimonio.

**Parámetros:**

- `accountingCycleId` - **Requerido** - ID del ciclo contable
- `companyId` - ID de la compañía
- `detailLevel` - Nivel de detalle (1=resumen, 2=detallado, 3=completo)

**Respuesta:**

```typescript
{
  assets: {
    title: "Activos",
    accounts: [...],
    total: string
  },
  liabilities: {
    title: "Pasivos",
    accounts: [...],
    total: string
  },
  equity: {
    title: "Patrimonio",
    accounts: [...],
    total: string
  },
  totals: {
    totalAssets: string,
    totalLiabilities: string,
    totalEquity: string,
    totalLiabilitiesAndEquity: string
  },
  cycleInfo: { ... }
}
```

### 5. Estado de Resultados (Income Statement)

**Endpoint:** `GET /accounting-reports/income-statement`

Muestra Ingresos, Gastos y Resultado del ejercicio.

**Parámetros:**

- `accountingCycleId` - **Requerido** - ID del ciclo contable
- `companyId` - ID de la compañía
- `detailLevel` - Nivel de detalle (1=resumen, 2=detallado, 3=completo)

**Respuesta:**

```typescript
{
  revenue: {
    title: "Ingresos",
    accounts: [...],
    total: string
  },
  expenses: {
    title: "Gastos",
    accounts: [...],
    total: string
  },
  result: {
    grossProfit: string,
    operatingIncome: string,
    netIncome: string
  },
  cycleInfo: { ... }
}
```

## 🚀 Optimizaciones

### Uso de Vistas Materializadas

El módulo aprovecha las vistas de base de datos para optimizar el rendimiento:

- **`active_account_balances_view`**: Calcula saldos actuales de todas las cuentas
- **`period_account_movements_view`**: Suma movimientos por cuenta y ciclo

Estas vistas evitan cálculos repetitivos y mejoran significativamente el tiempo de respuesta.

### Tipado Estricto

Todas las respuestas están fuertemente tipadas con interfaces TypeScript, garantizando:

- Integridad de datos
- Autocompletado en el IDE
- Detección temprana de errores
- Documentación implícita

## 🔒 Seguridad

Todos los endpoints requieren:

- **Roles:** `superadmin`, `admin`, o `accountant`
- **Permiso:** `read:accounting-reports`

## 📁 Estructura del Módulo

```
accounting-reports/
├── dto/
│   ├── filter-journal-book.dto.ts
│   ├── filter-general-ledger.dto.ts
│   ├── filter-trial-balance.dto.ts
│   ├── filter-balance-sheet.dto.ts
│   └── filter-income-statement.dto.ts
├── entities/
│   ├── journal-book.entity.ts
│   ├── general-ledger.entity.ts
│   ├── trial-balance.entity.ts
│   ├── balance-sheet.entity.ts
│   └── income-statement.entity.ts
├── accounting-reports.controller.ts
├── accounting-reports.service.ts
└── accounting-reports.module.ts
```

## 🔧 Uso desde el Frontend

### Ejemplo: Obtener Balance de Comprobación

```typescript
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['trial-balance', cycleId],
  queryFn: () =>
    fetch(
      `/api/accounting-reports/trial-balance?accountingCycleId=${cycleId}`,
    ).then((res) => res.json()),
});

// data.accounts - Array de cuentas
// data.summary - Totales
// data.cycleInfo - Información del ciclo
```

## 📝 Notas Importantes

1. **Balance de Comprobación** y reportes financieros usan la vista optimizada `active_account_balances_view`
2. **Libro Mayor** calcula saldos corridos en tiempo real para precisión absoluta
3. **Libro Diario** soporta paginación para manejar grandes volúmenes de asientos
4. Todos los montos se retornan como strings para evitar pérdida de precisión decimal
5. Los reportes solo incluyen asientos con status `POSTED` (excepto Libro Diario que permite filtrar)

## 🎯 Próximas Mejoras

- [ ] Exportación a Excel/PDF
- [ ] Comparativos entre períodos
- [ ] Gráficos y visualizaciones
- [ ] Reportes consolidados multi-empresa
- [ ] Cache de reportes frecuentes
