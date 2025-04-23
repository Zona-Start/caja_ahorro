import { z } from 'zod';

// Definir esquema de validación con Zod para el formulario
export const companyFormSchema = z.object({
  id: z.number(),
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  rif: z.string().nonempty({ message: 'El rif es requerido' }),
  address: z.string().nonempty({ message: 'La dirección es requerido' }),
  phone: z.string(),
  email: z.string().nonempty({ message: 'El correo electrónico es requerido' }),
  baseCurrencyCode: z.string(),
  contactPerson: z.string(),
  contactPhone: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const companyApiAllResponseSchema = z.object({
  message: z.string(),
  data: z.array(companyFormSchema),
});

export const companyApiOneResponseSchema = z.object({
  message: z.string(),
  data: companyFormSchema,
});

export type CompanyFormValue = z.infer<typeof companyFormSchema>;
