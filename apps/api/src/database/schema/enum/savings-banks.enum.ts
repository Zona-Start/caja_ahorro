import { savingsSchema } from '../_schemas';

export const associateMovementTypeEnum = savingsSchema.enum(
  'associate_movement_type',
  [
    // 1. Contribuciones y Aportes a Cuentas de Ahorro
    'SAVING_CONTRIBUTION',
    'EMPLOYER_CONTRIBUTION',
    'VOLUNTARY_SAVINGS',
    'SURPLUS_SAVINGS_CONTRIBUTION',

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
export const movementStatusEnum = savingsSchema.enum('movement_status', [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
  'REVERSED',
  'DONE',
]);

export const creditModalityTypeEnum = savingsSchema.enum(
  'credit_modality_type',
  ['ORDINARY', 'SPECIAL_QUOTAS'],
);
export const creditStatusEnum = savingsSchema.enum('credit_status', [
  'REQUESTED',
  'APPROVED',
  'IN_PAYMENT',
  'PAID',
]);
export const creditPaymentTypeEnum = savingsSchema.enum('credit_payment_type', [
  'PAYING',
  'CANCELLATION',
]);

export const loanModalityTypeEnum = savingsSchema.enum('loan_modality_type', [
  'ORDINARY',
  'SPECIAL_QUOTAS',
]);
export const loanStatusEnum = savingsSchema.enum('loan_status', [
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
export const loanPaymentTypeEnum = savingsSchema.enum('loan_payment_type', [
  'PAYING',
  'CANCELLATION',
]);

export const liquidationsStatusEnum = savingsSchema.enum(
  'liquidations_status',
  [
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
  ],
);
export const withdrawalStatusEnum = savingsSchema.enum('withdrawal_status', [
  'REQUESTED', // Solicitado por el asociado
  'APPROVED', // Aprobado, listo para desembolsar (o incluido en TXT)
  'REJECTED', // Rechazado (nunca se desembolsa)
  'REVERSED',
  'CANCELLED', // Cancelado por el usuario o administrador antes del desembolso (equivalente a ANULADO)
  'PENDING_DISBURSEMENT_BANK_BATCH', // Nuevo: Incluido en un TXT o lote para el banco, esperando confirmación
  'DISBURSED', // Desembolsado exitosamente (dinero en cuenta del asociado)
  'PROCESSED', // Procesado
  'DISBURSEMENT_FAILED', // Nuevo: Desembolso falló en el banco (revisar y reintentar o anular)
  'DISBURSED_REVERSED', // Nuevo: Desembolso fue revertido/anulado contablemente (por error o devolución)
  'ADJUSTED', // Nuevo: Indica que el retiro ha sido afectado por un ajuste contable
]);

export const paymentBatchItemType = savingsSchema.enum(
  'payment_batch_item_type',
  ['LOAN', 'WITHDRAWAL', 'LIQUIDATION'],
);
export const paymentBatchStatus = savingsSchema.enum('payment_batch_status', [
  'DRAFT', // en edición
  'UPLOADED', // archivo generado y subido al banco
  'PROCESSED', // banco respondió OK
  'CANCELLED', // anulado antes de procesar
]);
export const paymentStatusEnum = savingsSchema.enum('payment_status', [
  'PENDING',
  'PAID',
  'OVERDUE',
  'PARTIAL',
  'CANCELED',
  'DONE',
]);

export const paymentStatus = paymentStatusEnum;
