import { type ActionFunctionArgs } from 'react-router';
import { creditsPaidService } from '../services/credits-paid-service';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    if (request.method === 'POST') {
      const payload = JSON.parse(formData.get('payload') as string);
      await creditsPaidService.createCreditPayment(payload);
    }
    if (request.method === 'DELETE') {
      const id = formData.get('id') as string;
      await creditsPaidService.deleteCreditPayment(id);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
