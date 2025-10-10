// src/features/accounting/supplier-payments/mappers.ts
import type { SupplierPayment } from '../schemas';
import type { AccountPayableSchemaAPI } from '../schemas/account-payable-api.schema';
import { SupplierPaymentRow } from '../types/table';

export function toPaymentRow(p: SupplierPayment): SupplierPaymentRow {
  return {
    id: p.id,
    type: 'PAYMENT',
    status: p.status,
    reference: p.paymentNumber,
    amount: p.totalAmount.toString(), // o ya formateado
    date: p.requestedAt, // ISO string
    supplierId: p.supplierId,
    supplierName: p.supplierName ?? null,
  };
}

export function toPendingRow(a: AccountPayableSchemaAPI): SupplierPaymentRow {
  return {
    id: a.id,
    type: a.type, // "INVOICE" | "CREDIT_NOTE" ...
    status: a.status,
    reference: a.reference,
    amount: a.amount, // ya viene string
    date: a.date, // "yyyy-MM-dd"
    supplierId: a.supplierId,
    supplierName: a.supplierName,
  };
}
