import { SupplierTransaction } from '../schemas/supplier-transaction.schema';

export function mapSupplierTransactionApiToForm(data: any): SupplierTransaction {
  return {
    id: data.id,
    accountsPayableId: data.accountsPayableId,
    transactionType: data.transactionType,
    transactionDate: new Date(data.transactionDate),
    amount: data.amount,
    currencyCode: data.currencyCode,
    paymentMethod: data.paymentMethod,
    reference: data.reference,
    status: data.status,
  };
}
