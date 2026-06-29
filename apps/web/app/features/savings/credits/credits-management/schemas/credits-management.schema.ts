import { z } from 'zod';

export const creditManagementSchema = z.object({
  id: z.string().optional(),
  associateId: z.string({
    required_error: 'Por favor seleccione un asociado',
  }),
  creditTypeName: z.string().optional(),
  customReference: z.string().optional(),
  associateCedula: z.string().optional(),
  associateFullname: z.string().optional(),
  creditTypeId: z.string({
    required_error: 'Por favor seleccione el tipo de crédito',
  }),
  creditModality: z.string({
    required_error: 'Por favor seleccione la modalidad',
  }),
  requestDate: z.date({
    required_error: 'Por favor seleccione la fecha de solicitud',
  }),
  requestedAmount: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(1, { message: 'Por favor ingrese el monto del crédito' }),
  ),
  termMonths: z.string().optional(),
  interestRate: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(0, { message: 'La tasa de interés es requerida' }),
  ),
  startDate: z.date({
    required_error: 'Por favor seleccione la fecha de inicio',
  }),
  endDate: z.string().optional(),
  expensesAmount: z.string().optional(),
  expensesPercentage: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(0).max(100).optional(),
  ),
  overdraftAmount: z
    .preprocess((v) => (typeof v === 'string' ? parseFloat(v) || 0 : v), z.number().optional())
    .nullable(),
  previousCreditId: z.string().optional().nullable(),
  invoiceNumber: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional().nullable(),
  termType: z.string().default('installments'),
  termUnits: z.preprocess(
    (v) => (typeof v === 'string' ? parseInt(v, 10) || 1 : v),
    z.number().int().min(1, { message: 'La cantidad de plazos es requerida' }),
  ),
  useCommercialHouse: z.boolean().optional(),
  commercialHouseId: z.string().optional().nullable(),
  commercialHouseType: z.enum(['inventory', 'supplier']).optional(),
  commercialHouseSupplierId: z.string().optional(),
  useSpecialParams: z.boolean().optional(),
  allowOverdraft: z.boolean().optional(),
  haberesPayment: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(0).optional(),
  ),
  directPayment: z.preprocess(
    (v) => (typeof v === 'string' ? parseFloat(v) || 0 : v),
    z.number().min(0).optional(),
  ),
  directPaymentMethod: z.string().optional(),
  directPaymentReference: z.string().optional(),
  directPaymentBankAccountId: z.string().optional(),
  itemsJson: z.string().optional(),
  creditItems: z
    .array(
      z.object({
        agreedSellingPrice: z.number().min(0),
        itemId: z.string().optional(),
        itemType: z.enum(['PRODUCT', 'SERVICE', 'EXTERNAL']),
        itemDescription: z.string().optional(),
        quantity: z.number().min(1),
        saleDate: z.date(),
        days: z.string().optional(),
      }),
    )
    .optional(),
});

export type CreditManagement = z.infer<typeof creditManagementSchema>;

export const creditDefaults: CreditManagement = {
  associateId: '',
  creditTypeId: '',
  creditModality: 'ORDINARY',
  requestDate: new Date(),
  requestedAmount: 0,
  interestRate: 0,
  startDate: new Date(),
  termType: 'installments',
  termUnits: 1,
  useCommercialHouse: false,
  useSpecialParams: false,
  allowOverdraft: false,
  haberesPayment: 0,
  directPayment: 0,
};
