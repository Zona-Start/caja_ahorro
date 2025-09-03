import { SupplierPayment, SupplierPaymentAPI } from '../schemas';

// Maps the raw API response to the frontend's SupplierPayment schema
export function mapSupplierPaymentApiToForm(
  data: SupplierPaymentAPI,
): Partial<SupplierPayment> {
  return {
    id: data.id,
    supplierId: data.supplierId,
    paymentNumber: data.paymentNumber,
    totalAmount: parseFloat(data.totalAmount),
    currencyCode: data.currencyCode,
    paymentMethod: data.paymentMethod as any, // Cast as enum
    bankAccountId: data.bankAccountId,
    status: data.status,
    observations: data.observations,
    requestedAt: new Date(data.requestedAt),
    lines:
      data.lines?.map((line) => ({
        id: line.id,
        accountsPayableId: line.accountsPayableId,
        amount: parseFloat(line.amount),
        description: line.description,
      })) || [],
  };
}
