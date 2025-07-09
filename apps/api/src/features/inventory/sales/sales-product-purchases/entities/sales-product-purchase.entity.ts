export class SalesProductPurchase {
  id: number;
  productId: number;
  purchaseDate: string;
  quantity: number;
  unitCost: string;
  totalCost: string;
  supplierName?: string | null;
  invoiceReference?: string | null;
  bankTransactionId?: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}
