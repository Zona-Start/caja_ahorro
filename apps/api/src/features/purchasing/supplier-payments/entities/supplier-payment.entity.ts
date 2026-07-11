import { supplierPaymentLines, supplierPayments } from '@/database/schema';
import { InferSelectModel } from 'drizzle-orm';

export type SupplierPayment = InferSelectModel<typeof supplierPayments>;
export type SupplierPaymentLine = InferSelectModel<typeof supplierPaymentLines>;
