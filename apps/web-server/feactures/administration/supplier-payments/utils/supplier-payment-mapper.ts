import { SupplierPayment } from '../schemas';

// Maps the raw API response to the frontend's SupplierPayment schema
export function mapSupplierPaymentApiToForm(
  data: SupplierPayment,
): Partial<SupplierPayment> {
  return {
    id: data.id,
    supplierId: data.supplierId,
    paymentNumber: data.paymentNumber,
    totalAmount: Math.abs(data.totalAmount),
    currencyCode: data.currencyCode,
    paymentMethod: data.paymentMethod as any, // Cast as enum
    bankAccountId: data.bankAccountId,
    bankReference: data.bankReference,
    accountPayableNumber: data.accountPayableNumber,
    status: data.status,
    observations: data.observations,
    requestedAt: data.requestedAt,
    lines:
      data.lines?.map((line: any) => ({
        id: line.id,
        accountsPayableId: line.accountsPayableId,
        amount: parseFloat(line.amount),
        description: line.description,
        supplierPaymentId: line.supplierPaymentId,
      })) || [],
  };
}

//funciona mapear resultados de las cuentas por pagar pendientes
export function mapAccountPayableApiToForm(data: any) {
  if (!data) {
    return [];
  }

  return data.map((item: any) => {
    return {
      id: item.id,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      accountsPayableNumber: item.accountsPayableNumber,
      supplierInvoiceId: item.supplierInvoiceId,
      originalAmount: Math.abs(item.originalAmount),
      paidAmount: Number(item.paidAmount),
      remainingAmount: Math.abs(item.remainingAmount),
      status: item.status,
      observations: item.observations,
      supplierInvoice: item.supplierInvoice,
      createdAt: item.createdAt.split('T')[0],
      dueDate: item.dueDate,
    };
  });
}

////mapper en uso al consultar una cuenta para pagar
export const castAccount = (src?: any) => ({
  id: src?.id,
  supplierId: Number(src?.supplierId ?? 0),
  supplierName: src?.supplierName ?? '',
  accountsPayableNumber: src?.accountsPayableNumber ?? '',
  amount: Number(src?.amount ?? 0),
  paidAmount: Number(src?.paidAmount ?? 0),
  remainingAmount: Number(src?.remaingAmount ?? src?.amount ?? 0),
  invoiceNumber: src?.invoiceNumber ?? '',
});
