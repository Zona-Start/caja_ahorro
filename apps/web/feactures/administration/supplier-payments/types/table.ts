export type SupplierPaymentRow = {
  id: number;
  type: string; // "PAYMENT" | "CREDIT_NOTE" | "DEBIT_NOTE" ...
  status: string;
  reference: string; // número de documento visible
  amount: string; // ya formateado o como string
  date: string; // ISO o "yyyy-MM-dd"
  supplierId: number | null;
  supplierName: string | null;
  requestedAt?: string; // ISO string
  totalAmount?: number;
  paymentMethod?: string;
};
