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
      supplierInvoiceNumber: item.supplierInvoiceNumber,
      originalAmount: Number(item.originalAmount),
      paidAmount: Number(item.paidAmount),
      remainingAmount: Number(item.remainingAmount),
      isAuthorizePayment: item.isAuthorizePayment,
      status: item.status,
      observations: item.observations,
      supplierInvoice: item.supplierInvoice,
      createdAt: item.createdAt.split('T')[0],
      dueDate: item.dueDate,
    };
  });
}
