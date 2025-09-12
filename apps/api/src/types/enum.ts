// Enums Generales
export enum StatusEnum {
  ACTIVE = 'ACTIVE', // Asociado activo, puede realizar operaciones
  INACTIVE = 'INACTIVE', // Asociado inactivo temporalmente
  PENDING = 'PENDING', // Asociado en proceso de registro/aprobación
  SUSPENDED = 'SUSPENDED', // Asociado suspendido (ej. por mora grave)
  LOCKED = 'LOCKED', // Cuenta bloqueada
  RETIRED = 'RETIRED', // Asociado retirado y liqudiado (ya no es miembro, pero su historial se mantiene)
  ARCHIVED = 'ARCHIVED', // Nuevo: Para asociados o registros antiguos que se mantienen por historia pero no son activos ni liquidados
}

export enum GenderEnum {
  FEMENINO = 'FEMENINO',
  MASCULINO = 'MASCULINO',
  OTRO = 'OTRO',
}

export enum NationalityEnum {
  VENEZOLANO = 'VENEZOLANO',
  EXTRANJERO = 'EXTRANJERO',
}

export enum CurrencyCodeEnum {
  VES = 'VES',
  USD = 'USD',
  EUR = 'EUR',
}

// Enum Tipos de Cuenta Contable
export enum AccountTypeEnum {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
  MEMORANDUM = 'MEMORANDUM',
}

export enum AccountNatureEnum {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

// Enum Estado Ciclo Contable
export enum CycleStatusEnum {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  CLOSING = 'CLOSING',
}

// Enum Estado Préstamo
export enum LoanStatusEnum {
  REQUESTED = 'REQUESTED', // Solicitado por el asociado
  APPROVED = 'APPROVED', // Aprobado, listo para desembolsar (o incluido en TXT)
  REJECTED = 'REJECTED', // Rechazado (nunca se desembolsa)
  CANCELLED = 'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  PENDING_DISBURSEMENT_BANK_BATCH = 'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  DISBURSED = 'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  DISBURSEMENT_FAILED = 'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  DISBURSED_REVERSED = 'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  IN_PAYMENT = 'IN_PAYMENT', // En proceso de pago (al menos una cuota pagada)
  PAID = 'PAID', // Completamente pagado
  OVERDUE = 'OVERDUE', // Con cuotas vencidas
  ADJUSTED = 'ADJUSTED', // Nuevo: Indica que el préstamo ha sido afectado por un ajuste contable
}

// Enum Estado Credito
export enum CreditStatusEnum {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  IN_PAYMENT = 'IN_PAYMENT',
  PAID = 'PAID',
}

// Enum Estado Cuota Préstamo
export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  CANCELED = 'CANCELED',
}

// Enum Tipo Movimiento Cuenta Asociado
// Enum Tipo Movimiento Cuenta Asociado
export enum AssociateMovementTypeEnum {
  // 1. Contribuciones y Aportes a Cuentas de Ahorro
  SAVING_CONTRIBUTION = 'SAVING_CONTRIBUTION', // Aporte regular o adicional del asociado a su cuenta de ahorros (Abonos del asociado).
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION', // Aporte realizado por el empleador a la cuenta del asociado (Abonos patronales).
  VOLUNTARY_SAVINGS = 'VOLUNTARY_SAVINGS',

  // 2. Retiros de Cuentas de Ahorro
  SAVING_WITHDRAWAL = 'SAVING_WITHDRAWAL', // Retiro de fondos de la cuenta de ahorros del asociado (parcial o liquidación) (retiros parciales).

  // 3. Desembolsos de Préstamos / Créditos
  LOAN_DISBURSEMENT_CREDIT = 'LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo ordinario desembolsado a la cuenta del asociado (Monto prestamo ordinario aprobado).
  SPECIAL_LOAN_DISBURSEMENT_CREDIT = 'SPECIAL_LOAN_DISBURSEMENT_CREDIT', // Acreditación del monto de un préstamo con cuotas especiales desembolsado (monto prestamo con cuotas especiales).
  COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT = 'COMMERCIAL_CREDIT_DISBURSEMENT_CREDIT', // Acreditación del monto de un crédito comercial desembolsado (creditos comerciales).
  SPECIAL_CREDIT_DISBURSEMENT_CREDIT = 'SPECIAL_CREDIT_DISBURSEMENT_CREDIT', // Acreditación del monto de un crédito con cuotas especiales desembolsado (creditos con cuotas especiales).

  // 4. Refinanciamiento de Préstamos / Créditos (Manejo de saldo anterior)
  LOAN_REFINANCING_DEBIT = 'LOAN_REFINANCING_DEBIT', // Débito del saldo anterior de un préstamo al refinanciarlo.
  LOAN_REFINANCING_CREDIT = 'LOAN_REFINANCING_CREDIT', // Crédito del nuevo monto de un préstamo refinanciado (similar a un nuevo desembolso, pero específicamente por refinanciamiento).
  // Nota: Un refinanciamiento a menudo implica un LOAN_REFINANCING_DEBIT (cancelando el viejo) y LOAN_DISBURSEMENT_CREDIT (el nuevo),
  // pero estos tipos específicos ayudan a rastrear el evento de refinanciamiento.

  // 5. Pagos de Préstamos y Créditos
  LOAN_PAYMENT_DEBIT = 'LOAN_PAYMENT_DEBIT', // Débito por el pago de una cuota de préstamo (pagos de prestamos).
  COMMERCIAL_CREDIT_PAYMENT_DEBIT = 'COMMERCIAL_CREDIT_PAYMENT_DEBIT', // Débito por el pago de una cuota de crédito comercial (pagos de creditos).

  // 6. Reintegros y Sobrecargos de Préstamos/Créditos
  LOAN_REIMBURSEMENT_CREDIT = 'LOAN_REIMBURSEMENT_CREDIT', // Crédito por un reintegro de monto a un préstamo (ej. devolución de un cobro erróneo) (reintegros de prestamos).
  COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT = 'COMMERCIAL_CREDIT_REIMBURSEMENT_CREDIT', // Crédito por un reintegro de monto a un credito comercial  (ej. devolución de un cobro erróneo) (reintegros de creditos).
  LOAN_OVERPAYMENT_CREDIT = 'LOAN_OVERPAYMENT_CREDIT', // Crédito generado por un sobrepago de préstamo que queda a favor del asociado.
  COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT = 'COMMERCIAL_CREDIT_OVERPAYMENT_CREDIT', // Crédito generado por un sobrepago de crédito comercial.

  // 7. Préstamos con Retiros Parciales (Si esto significa un préstamo que se desembolsa en partes a lo largo del tiempo)
  // Este es un concepto de desembolso, por lo que el tipo de desembolso existente LOAN_DISBURSEMENT_CREDIT
  // o SPECIAL_LOAN_DISBURSEMENT_CREDIT podría usarse para cada parte desembolsada.
  // Si necesitas diferenciar cada "retiro" como un evento de préstamo en sí, podrías usar:
  LOAN_PARTIAL_DISBURSEMENT_CREDIT = 'LOAN_PARTIAL_DISBURSEMENT_CREDIT', // Para préstamos que se desembolsan en múltiples partes.

  // 8. Gastos y Cargos Varios (Comisiones, Intereses, etc.)
  WITHDRAWAL_FEE_DEBIT = 'WITHDRAWAL_FEE_DEBIT', // Débito por comisiones asociadas a retiros de ahorro.
  LOAN_INTEREST_DEBIT = 'LOAN_INTEREST_DEBIT', // Débito específico por los intereses generados por un préstamo.
  LOAN_FEE_DEBIT = 'LOAN_FEE_DEBIT', // Débito por otras comisiones o cargos de préstamo (ej. gastos de apertura).
  LOAN_ADMIN_FEE_DEBIT = 'LOAN_ADMIN_FEE_DEBIT', // Débito por gastos administrativos asociados a prestamos.
  LATE_PAYMENT_FEE_DEBIT = 'LATE_PAYMENT_FEE_DEBIT', // **RECOMENDADO:** Débito por recargos/multas por pagos tardíos.
  PAYMENT_REVERSAL_DEBIT = 'PAYMENT_REVERSAL_DEBIT', // **RECOMENDADO:** Débito para revertir un pago previo (ej. cheque rebotado).
  // Nota: Si un pago revertido implica una comisión por el rebote, tendrías LATE_PAYMENT_FEE_DEBIT o un nuevo BOUNCE_FEE_DEBIT.
  CREDIT_ADMIN_FEE_DEBIT = 'CREDIT_ADMIN_FEE_DEBIT', // Débito por gastos administrativos asociados a ciertos créditos (no préstamos).

  // 9. Otros Créditos (Ingresos no relacionados con Aportes/Préstamos)
  DIVIDEND_CREDIT = 'DIVIDEND_CREDIT', // Acreditación de dividendos o excedentes.
  FEE_REIMBURSEMENT_CREDIT = 'FEE_REIMBURSEMENT_CREDIT', // Reintegro de una comisión o cargo cobrado previamente.
  ADJUSTMENT_CREDIT = 'ADJUSTMENT_CREDIT', // Crédito por ajustes o correcciones positivas.

  // 10. Otros Débitos (Egresos no relacionados con Préstamos/Retiros directos)
  ADJUSTMENT_DEBIT = 'ADJUSTMENT_DEBIT', // Débito por ajustes o correcciones negativas.
  FEE_CORRECTION_DEBIT = 'FEE_CORRECTION_DEBIT', // Débito para corregir un cobro incorrecto de una comisión.
  ADMIN_FEE_DEBIT = 'ADMIN_FEE_DEBIT', // Gasto administrativo general (ej. mantenimiento de cuenta).
  OTHER_DEBIT = 'OTHER_DEBIT', // Otros tipos de débitos no especificados.
  FEE_DEBIT = 'FEE_DEBIT', // Débito genérico por comisiones o cargos varios no cubiertos por otros tipos específicos.

  // 11. Tipos Genéricos (Si aún necesitas más flexibilidad)
  OTHER_CREDIT = 'OTHER_CREDIT', // Otros tipos de créditos no especificados.

  //12. liqudiacion

  LIQUIDATION_BALANCE = 'LIQUIDATION_BALANCE',

  // --- NUEVOS TIPOS PARA REVERSIONES Y AJUSTES ---
  // Reversiones de Desembolsos
  LOAN_DISBURSEMENT_REVERSAL_DEBIT = 'LOAN_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de préstamo (Débito a la cuenta del asociado)
  SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT = 'SPECIAL_LOAN_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de préstamo especial
  COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT = 'COMMERCIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de crédito comercial
  SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT = 'SPECIAL_CREDIT_DISBURSEMENT_REVERSAL_DEBIT', // Nuevo: Reversión de desembolso de crédito especial

  // Reversiones de Pagos (lo que antes era 'PAYMENT_REVERSAL_DEBIT')
  LOAN_PAYMENT_REVERSAL_CREDIT = 'LOAN_PAYMENT_REVERSAL_CREDIT', // Nuevo: Reversión de un pago de préstamo (Crédito a la cuenta del asociado)
  COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT = 'COMMERCIAL_CREDIT_PAYMENT_REVERSAL_CREDIT', // Nuevo: Reversión de un pago de crédito comercial

  // Reversiones de Retiros
  SAVING_WITHDRAWAL_REVERSAL_CREDIT = 'SAVING_WITHDRAWAL_REVERSAL_CREDIT', // Nuevo: Reversión de un retiro de ahorros

  // Reversiones de Liquidación
  LIQUIDATION_BALANCE_REVERSAL_CREDIT = 'LIQUIDATION_BALANCE_REVERSAL_CREDIT', // Nuevo: Reversión de una liquidación de balance

  // Ajustes Contables Específicos (para ajustes que no son reversiones directas de un tipo específico)
  ACCOUNTING_ADJUSTMENT_DEBIT = 'ACCOUNTING_ADJUSTMENT_DEBIT', // Nuevo: Ajuste contable general (Débito)
  ACCOUNTING_ADJUSTMENT_CREDIT = 'ACCOUNTING_ADJUSTMENT_CREDIT', // Nuevo: Ajuste contable general (Crédito)
}

// Enum Estado Conciliación
export enum ReconciliationStatusEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVIEWED = 'REVIEWED',
}

export enum ReconciliationItemStatusEnum {
  PENDING = 'PENDING',
  RECONCILED = 'RECONCILED',
  MANUAL_MATCH = 'MANUAL_MATCH',
  ADJUSTMENT = 'ADJUSTMENT',
  EXCLUDED = 'EXCLUDED',
  NON_EXISTENT_IN_BANK = 'NON_EXISTENT_IN_BANK',
  VOIDED = 'VOIDED',
}

// Enum Acción Auditoría
export enum ActionEnumAudit {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CANCELED = 'CANCELED',
  PROCESS = 'PROCESS',
  PROCESS_EXECUTION = 'PROCESS_EXECUTION', // Más descriptivo: ejecución de un proceso (TXT, importación, etc.)
  DATA_IMPORT = 'DATA_IMPORT',
  CONFIGURATION_CHANGE = 'CONFIGURATION_CHANGE', // Nuevo: Cambios en configuraciones críticas
  ADJUSTMENT = 'ADJUSTMENT', // Nuevo: Para registrar la ejecución de un asiento de ajuste/reversión manual
  VIEW_REPORT = 'VIEW_REPORT', // Opcional: Si quieres auditar el acceso a reportes críticos
}

export enum ActionEnumAuditAuth {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

// Enum Tipo Cuenta Asociado (Ejemplo, podría ser FK a categoryType)
export enum AssociateAccountTypeEnum {
  SAVINGS = 'SAVINGS',
  EMPLOYER_CONTRIBUTION = 'EMPLOYER_CONTRIBUTION',
  MANDATORY_SAVINGS = 'MANDATORY_SAVINGS',
}

export enum paymentMethodEnum {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHECK = 'CHECK',
  DEPOSIT = 'DEPOSIT',
  OTHER = 'OTHER',
  MOBILE_PAYMENT = 'MOBILE_PAYMENT',
}

export enum paymentStatus {
  DONE = 'DONE',
  CANCELED = 'CANCELED',
}

export enum loanModalityTypeEnum {
  ORDINARY = 'ORDINARY',
  SPECIAL_QUOTAS = 'SPECIAL_QUOTAS',
}

export enum loanPaymetTypeEnum {
  CANCELLATION = 'CANCELLATION',
  PAYING = 'PAYING',
}

export enum creditModalityTypeEnum {
  ORDINARY = 'ORDINARY',
  SPECIAL_QUOTAS = 'SPECIAL_QUOTAS',
}

export enum creditPaymetTypeEnum {
  CANCELLATION = 'CANCELLATION',
  PAYING = 'PAYING',
}

export enum withdrawalStatusEnum {
  REQUESTED = 'REQUESTED', // Solicitado por el asociado
  APPROVED = 'APPROVED', // Aprobado, listo para desembolsar (o incluido en TXT)
  REJECTED = 'REJECTED', // Rechazado (nunca se desembolsa)
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  PENDING_DISBURSEMENT_BANK_BATCH = 'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  DISBURSED = 'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  DISBURSEMENT_FAILED = 'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  DISBURSED_REVERSED = 'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  ADJUSTED = 'ADJUSTED', // Nuevo: Indica que el retiro ha sido afectado por un ajuste contable
}

export enum liquidationsStatusEnum {
  REQUESTED = 'REQUESTED', // Solicitado por el asociado
  PROCESSED = 'PROCESSED', // Aprobado, listo para desembolsar (o incluido en TXT)
  REJECTED = 'REJECTED', // Rechazado (nunca se desembolsa),
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  PENDING_DISBURSEMENT_BANK_BATCH = 'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  DISBURSED = 'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  DISBURSEMENT_FAILED = 'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  DISBURSED_REVERSED = 'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  ADJUSTED = 'ADJUSTED', // Nuevo: Indica que el retiro ha sido afectado por un ajuste contable
}

export enum internalLinkStatusEnum {
  LINKED = 'LINKED',
  UNLINKED = 'UNLINKED',
  PARTIALLY_LINKED = 'PARTIALLY_LINKED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
}

export enum bankTransactionCategory {
  MEMBER_DUES = 'MEMBER_DUES', // Ejemplo: Cuotas de Ahorro, Aportes, etc.
  LOAN_DISABURSEMENT = 'LOAN_DISABURSEMENT', // Ejemplo: Dinero enviado por un préstamo
  LOAN_PAYMENT = 'LOAN_PAYMENT', // Ejemplo: Pagos recibidos de préstamos
  MEMBER_WITHDRAWAL = 'MEMBER_WITHDRAWAL', // Ejemplo: Retiro de haberes de un socio
  ADMINISTRATIVE_EXPENSES = 'ADMINISTRATIVE_EXPENSES', // Ejemplo: Alquiler, servicios, sueldos
  BANK_FEES = 'BANK_FEES', // Ejemplo: Comisiones cobradas por el banco
  INTEREST_EARNED = 'INTEREST_EARNED', // Ejemplo: Intereses generados por la cuenta
  TAXES = 'TAXES', // Ejemplo: Pagos de impuestos
  OTHER_INCOME = 'OTHER_INCOME',
  OTHER_EXPENSES = 'OTHER_EXPENSES',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER', // Entre cuentas de la caja
}

export enum fixedAssetsInventoryStatus {
  ACTIVE = 'ACTIVE', // En uso y operativo
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', // Actualmente en reparación
  INACTIVE = 'INACTIVE', // No en uso, pero aún propiedad de la caja
  DEREGISTERED = 'DEREGISTERED', // Ya no es propiedad de la caja
}

export enum productStatus {
  AVAILABLE = 'AVAILABLE', // EEl producto está disponible para la venta
  DISABLED = 'DISABLED', // El producto no está disponible para la venta ni es visible públicamente en el catálogo
  OUT_OF_STOCK = 'OUT OF STOCK', // El producto no tiene unidades disponibles para la venta en este momento
  COMMING_SOON = 'COMMING SOON', // El producto aún no está a la venta, pero los clientes pueden verlo y, en algunos casos, reservarlo
  ON_SALE = 'ON SALE', // en oferta
}

export enum categorySuppliers {
  ASSETS = 'ASSETS',
  SERVICE = 'SERVICE',
  PRODUCTS = 'PRODUCTS',
  MATERIALS = 'MATERIALS',
  FURNITURE = 'FURNITURE',
  OTHERS = 'OTHERS',
}

export enum statusSuppliers {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum purchaseOrderTypeEnum {
  SALES_INVENTORY = 'SALES_INVENTORY', // Producto para reventa (se relaciona con salesProducts)
  FIXED_ASSET = 'FIXED_ASSET', // Bien o activo fijo (se relaciona con fixedAssets)
  SERVICE = 'SERVICE', // Servicio (se relaciona con serviceProviders)
  EXPENSE = 'EXPENSE', // Gasto directo o suministro de oficina (no se inventaría)
  SERVICE_EXPENSE = 'SERVICE_EXPENSE', //Servicio como gasto interno
}

export enum purchaseOrderStatusEnum {
  DRAFT = 'DRAFT', // 	Se crea la OC, se puede editar.
  PENDING = 'PENDING', // Se envía al proveedor.
  RECEIVED = 'RECEIVED', // Llega una factura que cubre solo parte de la OC.
  INVOICED = 'INVOICED', //Todas las líneas de la OC ya tienen factura.
  CLOSED = 'CLOSED', // OC finalizada sin pendientes.
  CANCELLED = 'CANCELLED', //Se cancela antes de recibir factura.
}

export enum supplierInvoicesPaymentEnum {
  CASH = 'CASH',
  CREDIT = 'CREDIT',
}

// Enum para el estado de una factura (Cuentas por Pagar)
export enum invoiceSuppliersStatusEnum {
  DRAFT = 'DRAFT', // Captura inicial de la factura. se puede editar
  PENDING = 'PENDING', // Validada y lista para contabilizar.
  ACCOUNTED_FOR = 'ACCOUNTED_FOR', // Se contabiliza y genera CxP si es crédito o pago si es contado.
  PAID = 'PAID', // Totalmente pagada (si fue de contado y se pagó al momento).
  CANCELLED = 'CANCELLED', //Se cancela.
}

export enum priceTypeEnum {
  COST = 'COST',
  SELLING = 'SELLING',
  OFFER = 'OFFER',
}

// Enum para el estado de un pago a proveedor
export enum paymentAccountsPayableEnum {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  ADVANCE = 'ADVANCE',
  ADVANCE_PARTIAL = 'ADVANCE_PARTIAL',
  ADVANCE_APPLIED = 'ADVANCE_APPLIED',
}

export enum supplierTransactionsTypeEnum {
  PAYMENT = 'PAYMENT',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  ADVANCE = 'ADVANCE',
  ADVANCE_APPLIED = 'ADVANCE_APPLIED',
  CREDIT_NOTE_APPLIED = 'CREDIT_NOTE_APPLIED',
  DEBIT_NOTE_APPLIED = 'DEBIT_NOTE_APPLIED',
  REVERSED = 'REVERSED',
}

export enum movementTypeInventory {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST_IN = 'ADJUST_IN',
  ADJUST_OUT = 'ADJUST_OUT',
  TRANSFER = 'TRANSFER',
  COMMIT = 'COMMIT',
  UN_COMMIT = 'UN_COMMIT',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
}

export enum unitOfMeasureEnum {
  UNIT = 'UNIT',
  KILOGRAM = 'KILOGRAM',
  LITER = 'LITER',
  METER = 'METER',
  BOX = 'BOX',
  PACK = 'PACK',
}

export enum invoiceTypeEnum {
  EXPENSE = 'EXPENSE', // Factura de gasto
  PURCHASE = 'PURCHASE', // Factura de compra
}

export enum paymentSupplierStatusEnum {
  DRAFT = 'DRAFT', // Borrador
  PENDING = 'PENDING', // Por aprobar
  SENT_TO_BANK = 'SENT_TO_BANK', //  Enviado a banco
  PROCESSED = 'PROCESSED', // Procesado
  REJECTED = 'REJECTED', // Rechazado
  CANCELLED = 'CANCELLED', // Anulado
  REVERSED = 'REVERSED', // Reversar pago
}
