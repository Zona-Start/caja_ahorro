import { z } from 'zod';

/** Numeric fields may arrive as string (Postgres numeric) or number. */
const numeric = z.union([z.string(), z.number()]).nullable().optional();

// ── Customers ────────────────────────────────────────────────────────────────

export const customerSchema = z.object({
  id: z.string(),
  tenantId: z.string().optional(),
  name: z.string(),
  taxId: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  creditDays: z.number().nullable().optional(),
  creditLimit: numeric,
  isActive: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type Customer = z.infer<typeof customerSchema>;

export const customerFormSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().optional(),
  taxId: z.string().min(1, 'La cédula es requerida'),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
});

export type CustomerForm = z.infer<typeof customerFormSchema>;

export interface CustomerPayload {
  name: string;
  taxId: string;
  phone?: string;
  address?: string;
  email?: string;
}

export function toCustomerPayload(form: CustomerForm): CustomerPayload {
  return {
    name: [form.firstName, form.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(' '),
    taxId: form.taxId.trim(),
    phone: form.phone?.trim() || undefined,
    address: form.address?.trim() || undefined,
    email: form.email?.trim() || undefined,
  };
}

// ── Products for POS ─────────────────────────────────────────────────────────

export const posProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  status: z.string().optional(),
  totalCost: numeric,
  finalPriceNet: numeric,
  finalPriceGross: numeric,
  available: z.coerce.number().optional(),
});

export type PosProduct = z.infer<typeof posProductSchema>;

// ── Sales invoices ───────────────────────────────────────────────────────────

export const saleItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string(),
  productName: z.string().nullable().optional(),
  quantity: z.coerce.number(),
  unitPrice: z.coerce.number(),
  unitCost: numeric,
  taxRate: numeric,
  totalPrice: z.coerce.number(),
});

export type SaleItem = z.infer<typeof saleItemSchema>;

export const saleInvoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  status: z.string(),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  subtotal: numeric,
  taxAmount: numeric,
  totalAmount: numeric,
  paidAmount: numeric,
  balance: numeric,
  notes: z.string().nullable().optional(),
  deliveryNoteId: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerTaxId: z.string().nullable().optional(),
  customerPhone: z.string().nullable().optional(),
  customerAddress: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  items: z.array(saleItemSchema).optional(),
});

export type SaleInvoice = z.infer<typeof saleInvoiceSchema>;

export const SALE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  ISSUED: 'Emitida',
  PAID: 'Pagada',
  PARTIALLY_PAID: 'Abonada',
  CANCELLED: 'Anulada',
};

// ── Cart (POS) ───────────────────────────────────────────────────────────────

export interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unitCost: number;
}

export function cartLineTotal(line: CartLine): number {
  return Number((line.unitPrice * line.quantity).toFixed(2));
}

export function cartSubtotal(lines: CartLine[]): number {
  return Number(
    lines
      .reduce((acc, line) => acc + cartLineTotal(line), 0)
      .toFixed(2),
  );
}

export interface CreateSaleInput {
  customerId: string;
  saleType: 'CASH' | 'CREDIT';
  dueDate?: string;
  notes?: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
  cashRegisterSessionId?: string;
  createDeliveryNote?: boolean;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    unitCost: number;
  }>;
}

// ── Receivables / Payments ───────────────────────────────────────────────────

export const receivableSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  issueDate: z.string(),
  dueDate: z.string().nullable().optional(),
  totalAmount: numeric,
  paidAmount: numeric,
  balance: z.coerce.number(),
  status: z.string(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  customerTaxId: z.string().nullable().optional(),
});

export type Receivable = z.infer<typeof receivableSchema>;

export const paymentFormSchema = z.object({
  amount: z.coerce.number().positive('El monto debe ser mayor a cero'),
  paymentMethod: z
    .enum(['CASH', 'CARD', 'TRANSFER', 'OTHER'])
    .default('CASH'),
  cashRegisterSessionId: z.string().uuid().optional(),
  referenceNumber: z.string().max(100).optional(),
});

export type PaymentForm = z.infer<typeof paymentFormSchema>;

export const customerPaymentSchema = z.object({
  id: z.string(),
  paymentNumber: z.string(),
  paymentDate: z.string(),
  amount: numeric,
  paymentMethod: z.string(),
  referenceNumber: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  createdAt: z.string().optional(),
});

export type CustomerPayment = z.infer<typeof customerPaymentSchema>;

// ── Delivery notes ───────────────────────────────────────────────────────────

export const deliveryNoteSchema = z.object({
  id: z.string(),
  deliveryNumber: z.string(),
  status: z.string(),
  issueDate: z.string(),
  notes: z.string().nullable().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().optional(),
        productId: z.string(),
        productName: z.string().nullable().optional(),
        quantity: z.coerce.number(),
      }),
    )
    .optional(),
});

export type DeliveryNote = z.infer<typeof deliveryNoteSchema>;

// ── Generic paginated envelope ───────────────────────────────────────────────

export interface PaginatedMeta {
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}
