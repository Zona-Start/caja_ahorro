import { pgEnum } from 'drizzle-orm/pg-core';
import { authSchema } from '../schemas';

// Enums Generales
export const statusEnum = pgEnum('status_enum', [
  'ACTIVE', // Asociado activo, puede realizar operaciones
  'INACTIVE', // Asociado inactivo temporalmente
  'PENDING', // Asociado en proceso de registro/aprobación
  'SUSPENDED', // Asociado suspendido (ej. por mora grave)
  'LOCKED', // Cuenta bloqueada
  'RETIRED', // Asociado retirado y liqudiado (ya no es miembro, pero su historial se mantiene)
  'ARCHIVED', // Nuevo: Para asociados o registros antiguos que se mantienen por historia pero no son activos ni liquidados
]);

export const entryStatusEnum = pgEnum('accounting_entry_status', [
  'DRAFT', // 1. Editable, no validado aún
  'PENDING', // 2. Validado, pendiente de contabilizar (por aprobación o cierre)
  'POSTED', // 3. Contabilizado ⇒ **sí afecta saldos y reportes**
  'CANCELLED', // 4. Anulado (inverso generado o marcado como nulo)
]);
export const genderEnum = authSchema.enum('gender', [
  'FEMENINO',
  'MASCULINO',
  'OTRO',
]);
export const nationalityEnum = pgEnum('nationality', [
  'VENEZOLANO',
  'EXTRANJERO',
]);
export const currencyCodeEnum = pgEnum('currency_code_enum', [
  'VES',
  'USD',
  'EUR',
]); // Ampliar según sea necesario

// Enum Tipos de Cuenta Contable
export const accountTypeEnum = pgEnum('account_type_enum', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
  'MEMORANDUM',
]); // Cambié ORDEN por MEMORANDUM
export const accountNatureEnum = pgEnum('account_nature_enum', [
  'DEBIT',
  'CREDIT',
]); // Naturaleza Deudora o Acreedora

// Enum Estado Ciclo Contable
export const cycleStatusEnum = pgEnum('cycle_status_enum', [
  'OPEN',
  'CLOSED',
  'CLOSING',
  'PENDING',
]);

// Enum Estado Préstamo
export const loanStatusEnum = pgEnum('loan_status_enum', [
  'REQUESTED', // Solicitado por el asociado
  'APPROVED', // Aprobado, listo para desembolsar (o incluido en TXT)
  'REJECTED', // Rechazado (nunca se desembolsa)
  'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  'IN_PAYMENT', // En proceso de pago (al menos una cuota pagada)
  'PAID', // Completamente pagado
  'OVERDUE', // Con cuotas vencidas
  'ADJUSTED', // Nuevo: Indica que el préstamo ha sido afectado por un ajuste contable
]);

// Enum Estado Créditos
export const creditStatusEnum = pgEnum('credit_status_enum', [
  'REQUESTED',
  'APPROVED',
  'IN_PAYMENT',
  'PAID',
]);

// Enum Estado Cuota Préstamo
export const paymentStatusEnum = pgEnum('payment_status_enum', [
  'PENDING',
  'PAID',
  'OVERDUE',
  'PARTIAL',
  'CANCELED',
]);

// Enum Tipo Movimiento Cuenta Asociado
export const associateMovementTypeEnum = pgEnum(
  'associate_movement_type_enum',
  [
    // 1. Contribuciones y Aportes a Cuentas de Ahorro
    'SAVING_CONTRIBUTION',
    'EMPLOYER_CONTRIBUTION',
    'VOLUNTARY_SAVINGS',

    // 2. Retiros de Cuentas de Ahorro
    'SAVING_WITHDRAWAL',

    // 3. Desembolsos de Préstamos y Créditos
    'LOAN_DISBURSEMENT_CREDIT',
    'SPECIAL_LOAN_DISBURSEMENT_CREDIT',
    'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT',
    'SPECIAL_CREDIT_DISBURSEMENT_CREDIT',

    // 4. Refinanciamiento de Préstamos
    'LOAN_REFINANCING_DEBIT',
    'LOAN_REFINANCING_CREDIT',

    // 5. Pagos de Préstamos y Créditos
    'LOAN_PAYMENT_DEBIT',
    'COMMERCIAL_CREDIT_PAYMENT_DEBIT',

    // 6. Sobregiros y Reintegros de Préstamos/Créditos
    'LOAN_REIMBURSEMENT_CREDIT',
    'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT',
    'LOAN_OVERPAYMENT_CREDIT', // <<-- ¡QUITADO EL ESPACIO AQUÍ!
    'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT',

    // 7. Cargos y Comisiones Relacionados con Préstamos/Créditos
    'LOAN_PARTIAL_DISBURSEMENT_CREDIT',

    // 8. Otros Cargos y Reversiones
    'WITHDRAWAL_FEE_DEBIT',
    'LOAN_INTEREST_DEBIT',
    'LOAN_FEE_DEBIT',
    'LOAN_ADMIN_FEE_DEBIT',
    'LATE_PAYMENT_FEE_DEBIT',
    'PAYMENT_REVERSAL_DEBIT',
    'CREDIT_ADMIN_FEE_DEBIT',

    // 9. Ajustes y Correcciones
    'DIVIDEND_CREDIT',
    'FEE_REIMBURSEMENT_CREDIT',
    'ADJUSTMENT_CREDIT',

    // 10. Otros (Uso general para transacciones no clasificadas en las anteriores)
    'ADJUSTMENT_DEBIT',
    'FEE_CORRECTION_DEBIT',
    'ADMIN_FEE_DEBIT',
    'OTHER_DEBIT',
    'FEE_DEBIT',

    //11. tipos genericos
    'OTHER_CREDIT',

    //12. liqudiacion
    'LIQUIDATION_BALANCE',

    // --- NUEVOS TIPOS PARA REVERSIONES Y AJUSTES ---
    // Reversiones de Desembolsos
    'LOAN_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de préstamo (Débito a la cuenta del asociado)
    'SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de préstamo especial
    'COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de crédito comercial
    'SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de crédito especial

    // Reversiones de Pagos (lo que antes era 'PAYMENT_REVERSAL_DEBIT')
    'LOAN_PAYMENT_REVERSAL_CREDIT', // Nuevo: Reversión de un pago de préstamo (Crédito a la cuenta del asociado)
    'COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT', // Nuevo: Reversión de un pago de crédito comercial

    // Reversiones de Retiros
    'SAVING_WITHDRAWAL_REVERSAL_CREDIT', // Nuevo: Reversión de un retiro de ahorros

    // Reversiones de Liquidación
    'LIQUIDATION_BALANCE_REVERSAL_CREDIT', // Nuevo: Reversión de una liquidación de balance

    // Ajustes Contables Específicos (para ajustes que no son reversiones directas de un tipo específico)
    'ACCOUNTING_ADJUSTMENT_DEBIT', // Nuevo: Ajuste contable general (Débito)
    'ACCOUNTING_ADJUSTMENT_CREDIT', // Nuevo: Ajuste contable general (Crédito)

    //  Pagos de préstamos y créditos durante liquidación (Débitos a la cuenta de ahorro)
    'LIQUIDATION_LOAN_PAYMENT_DEBIT', // Pago de préstamo regular durante liquidación
    'LIQUIDATION_CREDIT_PAYMENT_DEBIT', // Pago de crédito  durante liquidación
    'LIQUIDATION_COMMERCIAL_CREDIT_PAYMENT_DEBIT', // Pago de crédito comercial durante liquidación
    'LIQUIDATION_SPECIAL_LOAN_PAYMENT_DEBIT', // Pago de préstamo especial durante liquidación
    'LIQUIDATION_SPECIAL_CREDIT_PAYMENT_DEBIT', // Pago de crédito especial durante liquidación
  ],
);

// Enum Estado Conciliación
export const reconciliationStatusEnum = pgEnum('reconciliation_status_enum', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'REVIEWED',
]);
export const reconciliationItemStatusEnum = pgEnum(
  'reconciliation_item_status_enum',
  [
    'PENDING',
    'RECONCILED',
    'MANUAL_MATCH',
    'ADJUSTMENT',
    'EXCLUDED',
    'NON_EXISTENT_IN_BANK',
    'VOIDED',
  ],
);

// Enum Acción Auditoría
export const actionEnumAudit = pgEnum('audit_action_enum', [
  'INSERT',
  'UPDATE',
  'DELETE',
  'REVERSED',
  'CANCELED',
  'PROCESS_EXECUTION', // Más descriptivo: ejecución de un proceso (TXT, importación, etc.)
  'DATA_IMPORT', // Nuevo: Para la carga masiva de datos
  'CONFIGURATION_CHANGE', // Nuevo: Cambios en configuraciones críticas
  'ADJUSTMENT', // Nuevo: Para registrar la ejecución de un asiento de ajuste/reversión manual
  'VIEW_REPORT', // Opcional: Si quieres auditar el acceso a reportes críticos
]);
export const actionEnumAuditAuth = pgEnum('audit_auth_action_enum', [
  'LOGIN',
  'LOGOUT',
]);

// Enum Tipo Cuenta Asociado (Ejemplo, podría ser FK a categoryType)
export const associateAccountTypeEnum = pgEnum('associate_account_type_enum', [
  'SAVINGS',
  'EMPLOYER_CONTRIBUTION',
  'MANDATORY_SAVINGS',
]);

export const paymentMethodEnum = pgEnum('payment_method_enum', [
  'CASH', // Efectivo
  'BANK_TRANSFER', // Transferencia bancaria
  'CHECK', // Cheque
  'DEPOSIT', // Depósito
  'OTHER', // Otro método
  'MOBILE_PAYMENT', //PAGO MOVIL
]);

export const paymentStatus = pgEnum('payment_status', ['DONE', 'CANCELED']);

// Enum Modalidad de prestamos
export const loanModalityTypeEnum = pgEnum('loan_modality_type_enum', [
  'ORDINARY',
  'SPECIAL_QUOTAS',
]);

// Enum Modalidad de pago de prestamo
export const loanPaymentTypeEnum = pgEnum('loan_payment_type_enum', [
  'PAYING',
  'CANCELLATION',
]);

// Enum Modalidad de creditos
export const creditModalityTypeEnum = pgEnum('credit_modality_type_enum', [
  'ORDINARY',
  'SPECIAL_QUOTAS',
]);

// Enum Modalidad de pago de prestamo
export const creditPaymentTypeEnum = pgEnum('credit_payment_type_enum', [
  'PAYING',
  'CANCELLATION',
]);

export const withdrawalStatusEnum = pgEnum('withdrawal_status_enum', [
  'REQUESTED', // Solicitado por el asociado
  'APPROVED', // Aprobado, listo para desembolsar (o incluido en TXT)
  'REJECTED', // Rechazado (nunca se desembolsa)
  'REVERSED',
  'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  'ADJUSTED', // Nuevo: Indica que el retiro ha sido afectado por un ajuste contable
]);

export const liquidationsStatusEnum = pgEnum('liquidations_status_enum', [
  'REQUESTED', // Solicitado por el asociado
  'PROCESSED', // Aprobado, listo para desembolsar (o incluido en TXT)
  'REJECTED', // Rechazado (nunca se desembolsa),
  'REVERSED',
  'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  'ADJUSTED', // Nuevo: Indica que el retiro ha sido afectado por un ajuste contable
]);

export const internalLinkStatusEnum = pgEnum('internal_link_status', [
  'LINKED',
  'UNLINKED',
  'PARTIALLY_LINKED',
  'NOT_APPLICABLE',
]);

export const bankTransactionCategory = pgEnum('bank_transaction_category', [
  'MEMBER_CONTRIBUTION', // aportes / carga haberes
  'MEMBER_WITHDRAWAL', // retiro parcial
  'PAYROLL_SETTLEMENT', // liquidación final
  'LOAN_DISBURSEMENT',
  'LOAN_PAYMENT',
  'CREDIT_DISBURSEMENT',
  'CREDIT_PAYMENT',
  'BATCH_DISBURSEMENT',
  'SUPPLIER_PAYMENT',
  'SUPPLIER_ADVANCE_PAYMENT',
  'INTERNAL_TRANSFER',
  'BANK_FEE',
  'INTEREST_EARNED',
  'INTEREST_CHARGED',
  'BANK_ADJUSTMENT',
  'TAX_DEBIT',
  'TAX_CREDIT',
  'OTHER_INCOME',
  'OTHER_EXPENSE',
  'OPENING_BANK',
  'CLOSING_BANK',
]);

export const fixedAssetsInventoryStatus = pgEnum(
  'fixed_assets_inventory_status',
  [
    'ACTIVE', // En uso y operativo
    'UNDER_MAINTENANCE', // Actualmente en reparación
    'INACTIVE', // No en uso, pero aún propiedad de la caja
    'DEREGISTERED', // Ya no es propiedad de la caja
  ],
);

export const productStatus = pgEnum('product-status', [
  'AVAILABLE', // EEl producto está disponible para la venta
  'DISABLED', // El producto no está disponible para la venta ni es visible públicamente en el catálogo
  'OUT_OF_STOCK', // El producto no tiene unidades disponibles para la venta en este momento
  'COMMING_SOON', // El producto aún no está a la venta, pero los clientes pueden verlo y, en algunos casos, reservarlo
  'ON_SALE', // en oferta
]);

export const categorySuppliers = pgEnum('category-suppliers', [
  'ASSETS',
  'SERVICE',
  'PRODUCTS',
  'MATERIALS',
  'FURNITURE',
  'OTHERS',
]);

export const statusSuppliers = pgEnum('status-suppliers', [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
]);

export const purchaseOrderTypeEnum = pgEnum('purchase_order_type_enum', [
  'SALES_INVENTORY', // Producto para reventa (se relaciona con salesProducts)
  'FIXED_ASSET', // Bien o activo fijo (se relaciona con fixedAssets)
  'SERVICE', // Servicio (se relaciona con serviceProviders)
  'EXPENSE', // Gasto directo o suministro de oficina (no se inventaría)
  'SERVICE_EXPENSE', //Servicio como gasto interno
]);

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status_enum', [
  'DRAFT', // 	Se crea la OC, se puede editar.
  'PENDING', // Se envía al proveedor.
  'RECEIVED', // Llega una factura que cubre solo parte de la OC.
  'INVOICED', //Todas las líneas de la OC ya tienen factura.
  'CLOSED', // OC finalizada sin pendientes.
  'CANCELLED', //Se cancela antes de recibir factura.
]);

export const supplierInvoicesPaymentEnum = pgEnum(
  'supplier_invoices_payment_enum',
  [
    'CASH', // de contado
    'CREDIT', // credito
  ],
);

// Enum para el estado de una factura (Cuentas por Pagar)
export const invoiceSuppliersStatusEnum = pgEnum(
  'invoice_supplier_status_enum',
  [
    'DRAFT', // Captura inicial de la factura. se puede editar
    'PENDING', // Validada y lista para contabilizar.
    'ACCOUNTED_FOR', // Se contabiliza y genera CxP si es crédito o pago si es contado.
    'PAID', // Totalmente pagada (si fue de contado y se pagó al momento).
    'CANCELLED', //Se cancela.
  ],
);

export const priceTypeEnum = pgEnum('price_type_enum', [
  'COST',
  'SELLING',
  'OFFER',
]);

// Enum para el estado de un pago a proveedor
export const paymentAccountsPayableEnum = pgEnum(
  'payment_accounts_payable_enum',
  [
    'PENDING', // 	Se crea CxP con fecha de vencimiento.
    'IN_PROGRESS', //Se genera un pago parcial o está en lote bancario.
    'PAID', // Totalmente saldada.
    'CANCELLED', //Se cancela por nota de crédito o error.
    'EXPIRED', // La fecha de vencimiento es menor aL dia .
  ],
);

export const supplierTransactionsTypeEnum = pgEnum(
  'supplier_transactions_type_enum',
  ['PAYMENT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADVANCE'],
);

export const movementTypeInventory = pgEnum('movement_type_inventory', [
  'IN',
  'OUT',
  'ADJUST_IN',
  'ADJUST_OUT',
  'TRANSFER',
  'COMMIT',
  'UN_COMMIT',
  'ORDERED',
  'RECEIVED',
]);

export const unitOfMeasureEnum = pgEnum('unit_of_measure', [
  'UNIT',
  'KILOGRAM',
  'LITER',
  'METER',
  'BOX',
  'PACK',
]);

export const invoiceTypeEnum = pgEnum('invoice_type_enum', [
  'EXPENSE', // Factura de gasto
  'PURCHASE', // Factura de compra
]);

export const paymentSupplierStatusEnum = pgEnum('payment_supplier_status', [
  'DRAFT', // Borrador
  'PENDING', // Por aprobar
  'SENT_TO_BANK', //  Enviado a banco
  'PROCESSED', // Procesado
  'REJECTED', // Rechazado
  'CANCELLED', // Anulado
  'REVERSED', // Reversar pago
]);

export const paymentBatchStatus = pgEnum('payment_batch_status', [
  'DRAFT', // en edición
  'UPLOADED', // archivo generado y subido al banco
  'PROCESSED', // banco respondió OK
  'CANCELLED', // anulado antes de procesar
]);

export const paymentBatchItemType = pgEnum('payment_batch_item_type', [
  'LOAN',
  'WITHDRAWAL',
  'LIQUIDATION',
]);

export const closingTypeEnum = pgEnum('closing_type', ['MONTH', 'YEAR']);
