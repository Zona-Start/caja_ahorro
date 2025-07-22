import { AccountPayable } from '../schemas/account-payable.schema';

export function mapAccountPayableApiToForm(data: any): AccountPayable {
  return {
    id: data.id,
    supplierInvoiceId: data.supplierInvoiceId,
    originalAmount: data.originalAmount,
    paidAmount: data.paidAmount,
    remainingAmount: data.remainingAmount,
    currencyCode: data.currencyCode,
    status: data.status,
    observations: data.observations,
  };
}
