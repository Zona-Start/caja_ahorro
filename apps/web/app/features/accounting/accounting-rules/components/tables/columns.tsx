import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { AccountingRule } from '../../schemas/accounting-rule.schema';
import { CellAction } from './cell-action';

const categoryTranslations: Record<string, string> = {
  SAVINGS_BANK: 'Caja de Ahorro',
  ADMINISTRATIVE: 'Administrativa',
  BANKING: 'Bancaria',
  ACCOUNTING: 'Contable',
  INVENTORY: 'Inventario',
};

const operationTypeTranslations: Record<string, string> = {
  PAYROLL_CONCEPT: 'Concepto Nómina',
  WITHDRAWAL_TYPE: 'Tipo de Retiro',
  LOAN_TYPE: 'Tipo de Préstamo',
  CREDIT_TYPE: 'Tipo de Crédito',
  CREDIT_PAYMENT: 'Pago de Crédito',
  LOAN_PAYMENT: 'Pago de Préstamo',
  LOAN_DISBURSEMENT: 'Desembolso Préstamo',
  INTEREST_ACCRUAL: 'Causación de Intereses',
  SAVINGS_UPLOAD: 'Carga de Haberes',
  INVOICE_RECEPTION: 'Recepción de Factura',
  SUPPLIER_ADVANCE: 'Anticipo a Proveedor',
  CREDIT_NOTE: 'Nota de Crédito',
  SUPPLIER_PAYMENT: 'Pago a Proveedor',
  TRANSFER_BETWEEN_ACCOUNTS: 'Transferencia entre Cuentas',
  BANK_DEBIT_NOTE: 'Nota de Débito Bancaria',
  BANK_CREDIT_NOTE: 'Nota de Crédito Bancaria',
  CHECK_ISSUANCE_PAYMENT: 'Emisión de Cheque / Pago',
  EMPLOYER_DEPOSIT_RECEPTION: 'Recepción Depósito Patronal',
  LOAN_COLLECTION_PAYROLL: 'Recaudación Préstamos (Nómina)',
  LOAN_COLLECTION_WINDOW: 'Cobro de Préstamo (Ventanilla)',
  CONTRIBUTION_INCOME_PAYROLL: 'Ingreso por Aportes (Nómina)',
  OTHER_BANKING: 'Otros (Bancos)',
  FISCAL_YEAR_CLOSING: 'Cierre de Ejercicio (Anual)',
  EXCHANGE_DIFFERENCE: 'Diferencia de Cambio',
  ASSET_DEPRECIATION: 'Depreciación de Activos',
  EXPENSE_AMORTIZATION: 'Amortización de Gastos',
  OTHER_ACCOUNTING: 'Otros (Contable)',
  GOODS_RECEIPT: 'Recepción de Mercancía',
  INVENTORY_ADJUSTMENT_NEG: 'Ajuste de Inventario (-)',
  SALE_OUTPUT: 'Salida por Venta',
  WAREHOUSE_TRANSFER: 'Transferencia entre Almacenes',
};

export const columns: ColumnDef<AccountingRule>[] = [
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => {
      const category = row.original.category;
      return <span>{categoryTranslations[category] || category}</span>;
    },
  },
  {
    accessorKey: 'operationType',
    header: 'Tipo de Operación',
    cell: ({ row }) => {
      const type = row.original.operationType;
      return <span>{operationTypeTranslations[type] || type}</span>;
    },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'isActive',
    header: 'Estatus',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      );
    },
  },
  {
    accessorFn: (row) => row.details?.length || 0,
    header: 'Detalles',
    cell: ({ getValue }) => <span>{getValue() as number} movimientos</span>,
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
