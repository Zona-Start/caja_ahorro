import { z } from 'zod';

export const creditManagementSchema = z.object({
  id: z.string().optional(),
  associateId: z.number(),
  creditTypeName: z.string().optional(),
  customReference: z.string().optional(),
  associateCedula: z.string().optional(),
  associateFullname: z.string().optional(),
  creditTypeId: z.string({
    required_error: 'Por favor seleccione el tipo de crédito',
  }),
  creditModality: z.string({
    required_error: 'Por favor seleccione el tipo de crédito',
  }),
  requestDate: z.date({
    required_error: 'Por favor seleccione la fecha de solicitud',
  }),
  requestedAmount: z.string().min(1, {
    message: 'Por favor ingrese el monto del crédito',
  }),
  termMonths: z.string(),
  interestRate: z
    .string()
    .min(1, { message: 'La tasa de interés es requerida' }),
  startDate: z.date({
    required_error: 'Por favor seleccione la fecha de inicio',
  }),
  endDate: z.string().optional(),
  expensesAmount: z.string().optional(),
  overdraftAmount: z.string().optional().nullable(),
  invoiceNumber: z.string().optional(),
  status: z.string().optional(),
  installmentsCount: z.string(),
  commercialHouseId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  products: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
      }),
    )
    .optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, 'La descripción es requerida'),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
        cost: z.number().min(0, 'El costo no puede ser negativo'),
        days: z.string().min(1, 'Debe seleccionar una jornada'),
      }),
    )
    .optional(),
  creditItems: z
    .array(
      z.object({
        agreedSellingPrice: z
          .number()
          .min(0, 'El precio no puede ser negativo'),
        itemId: z.number().optional(),
        itemType: z.string().min(1, 'El tipo es requerido'),
        itemDescription: z.string().optional(),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
        days: z.string().min(1, 'Debe seleccionar una jornada'),
      }),
    )
    .optional(),
  useCommercialHouse: z.boolean().optional(),
  termType: z.string({
    required_error: 'Por favor seleccione el tipo de plazo',
  }),
  termUnits: z
    .string()
    .min(1, { message: 'La cantidad de plazos es requerida' }),
});

export type CreditManagement = z.infer<typeof creditManagementSchema>;