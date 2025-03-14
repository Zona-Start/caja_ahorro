import { z } from 'zod';


// Definir esquema de validación con Zod para el formulario
export const savingFormSchema = z.object({
    id: z.number(),
    name: z.string().nonempty(),
    rif: z.string().nonempty(),
    address: z.string().nonempty(),
    phone: z.string(),
    email: z.string().nonempty(),
    personContact: z.string(),
    phoneContact: z.string(),
  });
  
  export type SavingBankFormValue = z.infer<typeof savingFormSchema>;
