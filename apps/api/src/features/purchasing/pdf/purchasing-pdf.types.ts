export interface TenantPdfInfo {
  name: string;
  rif: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface SupplierPdfInfo {
  name: string;
  taxId: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface PurchasingPdfItem {
  description: string;
  quantity: number;
  unitCost: number;
  taxPercent?: number;
  totalLine: number;
}

export interface PurchasingPdfTotals {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export interface AppliedAccountPayable {
  reference: string;
  amount: number;
}

export interface PurchasingPdfPaymentInfo {
  method: string;
  bankReference?: string;
  bankDescription?: string;
  appliedAccountsPayable: AppliedAccountPayable[];
}

export interface PurchasingPdfConfig {
  title: string;
  reference: string;
  numericReference?: string;
  date: Date;
  dueDate?: Date;
  supplier: SupplierPdfInfo;
  currencyCode: string;
  exchangeRate?: number;
  items?: PurchasingPdfItem[];
  paymentInfo?: PurchasingPdfPaymentInfo;
  totals: PurchasingPdfTotals;
  subtotals?: { label: string; amount: number }[];
  observations?: string;
  tenant: TenantPdfInfo;
}
