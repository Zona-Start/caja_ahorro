import { z } from 'zod';

export const loanQuotasAssociate = z.object({
  id: z.number(), // id de la cuota
  quotaNumber: z.number(), //numero de cuota
  quotaAmount: z.string(), // monto de la cuota
  quotaDate: z.string(), // fecha de la cuota
  quotaPartial: z.string().nullable().optional(),
  quotaStatus: z.string(), // estado de la cuota
  principalBalancePending: z.string(), // saldo pendiente de capital
  paidAmount: z.string(), // monto pagado para esta cuota
});

export const loanAssociate = z.object({
  id: z.number(),
  cedula: z.string(),
  fullname: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  loanId: z.number().nullable(),
  loanPaidId: z.number().optional().nullable(),
  loanType: z.string().nullable(),
  loanTotalAmount: z.string().nullable(),
  loanModality: z.string().nullable(),
  loanStatus: z.string().nullable(), // <-- AÑADIR ESTA LÍNEA
  loanAmortization: z
    .array(loanQuotasAssociate)
    .nullable()
    .transform((val) => (val && val.length === 0 ? null : val)),
});

export type AssociatesLoan = z.infer<typeof loanAssociate>;
