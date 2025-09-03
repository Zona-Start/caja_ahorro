
// Esta entidad es una representación para el uso en la lógica de negocio.
// La definición "real" de la tabla está en el esquema de Drizzle.
export class SupplierPayment {
  id: number;
  paymentNumber: string;
  supplierId: number;
  totalAmount: string;
  currencyCode: string;
  paymentMethod: string;
  bankAccountId?: number;
  status: string;
  requestedAt: Date;
  processedAt?: Date;
  reversedAt?: Date;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SupplierPaymentLine {
  id: number;
  supplierPaymentId: number;
  accountsPayableId?: number;
  amount: string;
  description?: string;
}
