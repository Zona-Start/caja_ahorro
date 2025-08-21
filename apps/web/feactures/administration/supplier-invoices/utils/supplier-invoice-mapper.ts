import { SupplierInvoice } from '../schemas/supplier-invoice.schema';

export function mapSupplierInvoiceApiToForm(data: any): SupplierInvoice {
  return {
    id: data.id,
    supplierId: data.supplierId,
    purchaseOrderId: data.purchaseOrderId,
    invoiceNumber: data.invoiceNumber,
    controlNumber: data.controlNumber,
    invoiceDate: new Date(data.invoiceDate),
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    subtotal: data.subtotal,
    taxAmount: data.taxAmount,
    totalAmount: data.totalAmount,
    currencyCode: data.currencyCode,
    paymentType: data.paymentType,
    status: data.status,
    observations: data.observations,
    invoiceType: data.invoiceType,
    items: data.items.map((item: any) => ({
      id: item.id,
      lineType: item.lineType,
      description: item.description,
      quantity: item.quantity,
      unitCost: item.unitCost,
      totalLine: item.totalLine,
      itemId: item.itemId,
      expenseAccountId: item.expenseAccountId,
    })),
  };
}
