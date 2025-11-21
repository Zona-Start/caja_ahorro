# Módulo de Balances Contables (Accounting Balances)

Este módulo gestiona los balances contables de la empresa, incluyendo carga inicial, cierre y apertura de ciclos contables.

## 📁 Estructura del Módulo

```
accounting-balances/
├── actions/
│   └── accounting-balance-actions.ts       # Server actions para API
├── components/
│   ├── accounting-balance-header.tsx       # Encabezado con acciones principales
│   ├── accounting-balances-list.tsx        # Lista contenedora
│   ├── bootstrapping-modal.tsx             # Modal para carga inicial
│   ├── close-cycle-modal.tsx               # Modal para cerrar ciclo
│   ├── open-cycle-modal.tsx                # Modal para abrir ciclo
│   └── tables/
│       ├── columns.tsx                     # Definición de columnas
│       ├── cell-action.tsx                 # Acciones por fila
│       └── accounting-balance-table-action.tsx  # Tabla con filtros
├── hooks/
│   ├── use-query-accounting-balance.ts     # Hook de consulta
│   ├── use-accounting-balance-mutation.ts  # Hooks de mutación
│   └── use-accounting-balance-table-filters.ts  # Filtros de tabla
├── schemas/
│   ├── accounting-balance.schema.ts        # Esquemas Zod
│   └── accounting-balance-api.ts           # Esquemas de respuesta API
└── utils/
    └── searchparams.ts                     # Utilidades de URL params
```

## 🎯 Funcionalidades

### 1. **Carga Inicial (Bootstrapping)**

- Soporta dos métodos de carga:
  - **JSON Manual**: Array de objetos con `accountCode`, `descripcion`, `balance`
  - **Archivo Excel**: Columnas `cuenta`, `descripcion`, `saldo`
- Validación de ecuación contable
- Template descargable para Excel

### 2. **Cierre de Ciclo Contable**

- Cierre estándar de período
- Opción de cierre de ejercicio fiscal
- Refundición automática de cuentas de ingresos y gastos
- Cálculo de resultado del ejercicio

### 3. **Apertura de Ciclo Contable**

- Roll-forward desde ciclo cerrado
- Selección de fechas con calendario
- Reset automático de cuentas de resultados en nuevo año fiscal

### 4. **Consulta de Balances**

- Lista paginada con filtros
- Búsqueda por código o nombre de cuenta
- Filtros por ciclo contable y compañía
- Formato de moneda para valores

## 🔌 Endpoints del Backend

### GET `/accounting-balance`

Lista paginada de balances contables.

**Query Params:**

- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10)
- `search`: Búsqueda por código o nombre
- `sortBy`: Campo para ordenar (default: 'accountCode')
- `sortOrder`: Orden ascendente o descendente (default: 'asc')
- `accountingCycleId`: Filtrar por ciclo contable
- `companyId`: Filtrar por compañía

### POST `/accounting-balance/bootstrapping`

Carga inicial de balances.

**Body (JSON):**

```json
{
  "balances": [
    {
      "accountCode": "1.1.01.001",
      "descripcion": "Caja Principal",
      "balance": 50000.0
    }
  ]
}
```

**Body (FormData - Excel):**

```
file: archivo.xlsx
```

### POST `/accounting-balance/close/:id`

Cierra un ciclo contable.

**Body:**

```json
{
  "isFiscalYearEnd": false
}
```

### POST `/accounting-balance/open`

Abre un nuevo ciclo contable.

**Body:**

```json
{
  "previousCycleId": 1,
  "startDate": "2024-02-01",
  "endDate": "2024-02-29",
  "description": "Ciclo Febrero 2024"
}
```

## 📊 Esquemas de Datos

### AccountingBalance

```typescript
{
  id?: number;
  companyId: number;
  accountingCycleId: number;
  accountPlanId: number;
  initialBalance: string;
  debitBalance: string;
  creditBalance: string;
  finalBalance: string;
  accountCode?: string;
  accountName?: string;
  accountNature?: 'DEBIT' | 'CREDIT';
}
```

### BalanceItem (para carga inicial)

```typescript
{
  accountCode: string;
  descripcion: string;
  balance: number;
}
```

## 🎨 Componentes Principales

### AccountingBalanceHeader

Encabezado con botones para:

- Carga inicial (Bootstrapping)
- Cerrar ciclo
- Abrir ciclo

### AccountingBalancesList

Contenedor principal que renderiza la tabla de balances.

### BootstrappingModal

Modal con tabs para seleccionar método de carga:

- **Archivo Excel**: Upload con template descargable
- **JSON Manual**: Textarea para pegar JSON

### CloseCycleModal

Modal para cerrar ciclo con:

- Selector de ciclo a cerrar
- Checkbox para marcar como cierre fiscal
- Advertencia sobre refundición

### OpenCycleModal

Modal para abrir nuevo ciclo con:

- Selector de ciclo anterior (cerrado)
- Calendarios para fechas de inicio y fin
- Campo opcional de descripción

## 🔧 Hooks Disponibles

### usePaginatedAccountingBalances

```typescript
const { data, isLoading } = usePaginatedAccountingBalances({
  page: 1,
  limit: 10,
  accountingCycleId: '1',
});
```

### useBootstrappingMutation

```typescript
const mutation = useBootstrappingMutation();
mutation.mutate({ balances: [...] });
```

### useBootstrappingWithFileMutation

```typescript
const mutation = useBootstrappingWithFileMutation();
mutation.mutate(file);
```

### useCloseCycleMutation

```typescript
const mutation = useCloseCycleMutation();
mutation.mutate({ cycleId: 1, payload: { isFiscalYearEnd: false } });
```

### useOpenCycleMutation

```typescript
const mutation = useOpenCycleMutation();
mutation.mutate({
  previousCycleId: 1,
  startDate: new Date(),
  endDate: new Date(),
  description: 'Nuevo ciclo',
});
```

## 📝 Uso en Páginas

```typescript
import { AccountingBalanceHeader } from '@/feactures/accounting/accounting-balances/components/accounting-balance-header';
import { AccountingBalancesList } from '@/feactures/accounting/accounting-balances/components/accounting-balances-list';

export default function AccountingBalancesPage() {
  return (
    <div className="space-y-6">
      <AccountingBalanceHeader />
      <AccountingBalancesList />
    </div>
  );
}
```

## ⚠️ Notas Importantes

1. **Carga Inicial**: Solo se puede ejecutar una vez por ciclo contable. La tabla debe estar vacía.

2. **Cierre de Ciclo**:
   - No puede haber asientos en estado DRAFT o PENDING
   - Debe haber balance entre débitos y créditos
   - Es irreversible

3. **Cierre Fiscal**:
   - Cancela cuentas de ingresos y gastos
   - Calcula resultado del ejercicio
   - Registra en cuenta de patrimonio configurada

4. **Apertura de Ciclo**:
   - Solo desde ciclos cerrados
   - Cuentas de resultados se resetean en nuevo año fiscal
   - Cuentas de balance mantienen su saldo final

## 🔐 Permisos Requeridos

- `read:accounting-balance` - Ver balances
- `create:initial-balance` - Carga inicial
- `update:accounting-cycle` - Cerrar ciclo
- `create:accounting-cycle` - Abrir ciclo

## 🎯 Query Keys

```typescript
queryKeys.accountingBalances.all();
queryKeys.accountingBalances.paginated(params);
queryKeys.accountingBalances.detail(id);
```
