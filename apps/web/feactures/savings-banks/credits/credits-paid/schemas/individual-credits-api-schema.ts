import { z } from 'zod';

export const creditQuotasAssociate = z.object({
  id: z.number(), // id de la cuota
  quotaNumber: z.number(), //numero de cuota
  quotaAmount: z.string(), // monto de la cuota
  quotaDate: z.string(), // fecha de la cuota
  quotaPartial: z.string().nullable().optional(),
  quotaStatus: z.string(), // estado de la cuota
  principalBalancePending: z.string(), // saldo pendiente de capital
  paidAmount: z.string(), // monto pagado para esta cuota
});

export const creditAssociate = z.object({
  id: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string(),
  email: z.string(),
  creditId: z.number().nullable(),
  creditPaidId: z.number().optional().nullable(),
  creditType: z.string().nullable(),
  creditTotalAmount: z.string(),
  creditModality: z.string().nullable(),
  creditAmortization: z.array(creditQuotasAssociate).nullable(),
});

export type AssociatesCredit = z.infer<typeof creditAssociate>;
