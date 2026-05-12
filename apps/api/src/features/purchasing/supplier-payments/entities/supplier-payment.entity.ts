import { supplierPayments, supplierPaymentLines } from '@/database/schema';
import { InferSelectModel } from 'drizzle-orm';

export type SupplierPayment = InferSelectModel<typeof supplierPayments>;
export type SupplierPaymentLine = InferSelectModel<typeof supplierPaymentLines>;
