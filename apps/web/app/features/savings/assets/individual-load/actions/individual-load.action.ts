import { type ActionFunctionArgs, redirect } from 'react-router';
import { individualLoadService } from '../services/individual-load-service';
import { formSchema } from '../schemas/individual-load-schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  // Aquí transformaríamos el FormData a un objeto compatible con LoadAssest
  // Dado que LoadAssest tiene validaciones Zod complejas, la transformación es clave
  const data = Object.fromEntries(formData);
  
  // Refactor: Convertir tipos según formSchema
  const payload = formSchema.parse({
    ...data,
    associateAccountId: Number(data.associateAccountId),
    amount: Number(data.amount),
    employerAmount: Number(data.employerAmount),
    associateAmount: Number(data.associateAmount),
    bankAccountId: Number(data.bankAccountId),
    transactionDate: new Date(data.transactionDate as string),
    includeBankingDetails: data.includeBankingDetails === 'true',
  });

  try {
    await individualLoadService.saveIndividualLoad(payload);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
