import { z } from 'zod';

// Definir esquema de validación con Zod para el formulario
export const savingFormSchema = z.object({
  id: z.number(),
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  rif: z.string().nonempty({ message: 'El rif es requerido' }),
  address: z.string().nonempty({ message: 'La dirección es requerido' }),
  phone: z.string(),
  email: z.string().nonempty({ message: 'El correo electrónico es requerido' }),
  personContact: z.string(),
  phoneContact: z.string(),
});

export type SavingBankFormValue = z.infer<typeof savingFormSchema>;
