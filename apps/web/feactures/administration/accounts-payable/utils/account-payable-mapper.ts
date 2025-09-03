export function mapAccountPayableApiToForm(data: any) {
  if (!data) {
    return [];
  }

  return data.map((item: any) => {
    return {
      id: item.id,
      accountsPayableNumber: item.accountsPayableNumber,
      supplierInvoiceId: item.supplierInvoiceId,
      originalAmount: Number(item.originalAmount),
      paidAmount: Number(item.paidAmount),
      remainingAmount: Number(item.remainingAmount),
      status: item.status,
      observations: item.observations,
      supplierInvoice: item.supplierInvoice,
      createdAt: item.createdAt.split('T')[0],
      dueDate: item.dueDate,
    };
  });
}
