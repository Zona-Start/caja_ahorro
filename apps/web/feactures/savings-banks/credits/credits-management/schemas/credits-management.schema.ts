import { z } from 'zod';

// Esquema de validación del formulario
export const creditManagementSchema = z.object({
  id: z.string().optional(),
  associateId: z.number(),
  creditTypeName: z.string().optional(),
  customReference: z.string().optional(),
  associateCedula: z.string().optional(),
  associateFullname: z.string().optional(),
  creditTypeId: z.string({
    required_error: 'Por favor seleccione el tipo de crédito',
  }), //tipo de credito
  creditModality: z.string({
    required_error: 'Por favor seleccione el tipo de crédito',
  }), //modalidad
  requestDate: z.date({
    required_error: 'Por favor seleccione la fecha de solicitud',
  }), //fecha solicitud
  requestedAmount: z.string().min(1, {
    message: 'Por favor ingrese el monto del crédito',
  }), //monto credito
  termMonths: z.string(), //plazos
  interestRate: z.string(), //interes
  startDate: z.date({
    required_error: 'Por favor seleccione la fecha de inicio',
  }), //fecha inicio
  endDate: z.string().optional(), //fecha culminacion
  expensesAmount: z.string().optional(), //monto gasto
  overdraftAmount: z.string().optional().nullable(), //monto sobregiro
  invoiceNumber: z.string().optional(), //numero de factura
  status: z.string().optional(), //status
  installmentsCount: z.string(), //cantidad de cuotas
  commercialHouseId: z.string({
    required_error: 'Por favor seleccione la casa comercial',
  }), //casa comercial
  notes: z.string(), //observaciones
  products: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
      }),
    )
    .optional(),
});

export type CreditManagement = z.infer<typeof creditManagementSchema>;
