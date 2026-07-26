import { purchasingSchema } from '../_schemas';

export const categorySuppliers = purchasingSchema.enum('category_suppliers', [
  'ASSETS',
  'SERVICE',
  'PRODUCTS',
  'MATERIALS',
  'FURNITURE',
  'OTHERS',
]);

export const statusSuppliers = purchasingSchema.enum('status_suppliers', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const purchaseOrderTypeEnum = purchasingSchema.enum(
  'purchase_order_type',
  [
    'SALES_INVENTORY', // Producto para reventa (se relaciona con salesProducts)
    'FIXED_ASSET', // Bien o activo fijo (se relaciona con fixedAssets)
    'SERVICE', // Servicio (se relaciona con serviceProviders)
    'EXPENSE', // Gasto directo o suministro de oficina (no se inventaría)
    'SERVICE_EXPENSE', //Servicio como gasto interno
  ],
);

export const purchaseOrderStatusEnum = purchasingSchema.enum(
  'purchase_order_status',
  [
    'DRAFT', // 	Se crea la OC, se puede editar.
    'APPROVED', // Aprobada, lista para recibir mercancia
    'RECEIVED', //Todas las líneas de la OC ya tienen factura. 
    'PARTIALLY_RECEIVED', // Llega una factura que cubre solo parte de la OC.
    'CLOSED', // OC finalizada sin pendientes.
    'CANCELLED', //Se cancela antes de recibir factura.
  ],
);

export const invoiceSuppliersStatusEnum = purchasingSchema.enum(
  'invoice_suppliers_status',
  [
    'DRAFT', // Captura inicial de la factura. se puede editar
    'APPROVED', // Validada y lista para contabilizar.
    'PARTIALLY_PAID', // Se contabiliza y genera CxP si es crédito o pago si es contado.
    'PAID', // Totalmente pagada (si fue de contado y se pagó al momento).
    'CANCELLED', //Se cancela.
  ],
);

export const paymentAccountsPayableEnum = purchasingSchema.enum(
  'payment_accounts_payable',
  [
    'PENDING', // 	Se crea CxP con fecha de vencimiento.
    'APPROVED', //  Aprobada, lista para pagar.
    'PARTIALLY_PAID', //Se genera un pago parcial o está en lote bancario.
    'PAID', // Totalmente saldada.
    'CANCELLED', //Se cancela por nota de crédito o error.
  ],
);

export const supplierInvoicesPaymentEnum = purchasingSchema.enum(
  'supplier_invoices_payment',
  [
    'CASH', // de contado
    'CREDIT', // credito
  ],
);

export const paymentSupplierStatusEnum = purchasingSchema.enum(
  'payment_supplier_status',
  [
    'DRAFT',
    'PENDING',
    'SENT_TO_BANK',
    'PROCESSED',
    'REJECTED',
    'CANCELLED',
    'REVERSED',
  ],
);

export const supplierTransactionsTypeEnum = purchasingSchema.enum(
  'supplier_transactions_type',
  ['PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADVANCE'],
);
