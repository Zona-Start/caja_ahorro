import { type ActionFunctionArgs } from 'react-router';
import { loansPaidService } from '../services/loans-paid-service';
import { loanPaymentSchema } from '../schemas/loans-paid.schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  
  try {
    if (method === 'POST') {
      const payload = loanPaymentSchema.parse(JSON.parse(formData.get('payload') as string));
      await loansPaidService.createLoanPayment(payload);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
