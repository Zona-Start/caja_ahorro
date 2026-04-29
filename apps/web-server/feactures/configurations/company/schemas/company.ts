import { z } from 'zod';

// Definir esquema de validación con Zod para el formulario
export const companyFormSchema = z.object({
  id: z.number(),
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  rif: z.string().nonempty({ message: 'El rif es requerido' }),
  address: z.string().nonempty({ message: 'La dirección es requerido' }),
  phone: z.string().nullable(),
  email: z.string().nonempty({ message: 'El correo electrónico es requerido' }),
  contactPerson: z.string().nullable(),
  contactPhone: z.string().nullable(),
  contactEmail: z.string().nullable(),
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
