import { type ActionFunctionArgs } from 'react-router';
import { creditsPaidService } from '../services/credits-paid-service';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  
  try {
    if (method === 'POST') {
      const payload = JSON.parse(formData.get('payload') as string);
      await creditsPaidService.createCreditPayment(payload);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
