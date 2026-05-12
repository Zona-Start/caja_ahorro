import { type ActionFunctionArgs } from 'react-router';
import { withdrawalService } from '../services/withdrawal-service';
import { withdrawalSchema } from '../schemas/withdrawal.schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  
  try {
    if (method === 'POST') {
      const payload = withdrawalSchema.parse(JSON.parse(formData.get('payload') as string));
      await withdrawalService.saveWithdrawal(payload);
    } else if (method === 'PATCH') {
      const pathParts = new URL(request.url).pathname.split('/');
      const id = Number(pathParts[pathParts.length - 2]);
      const actionType = pathParts[pathParts.length - 1];

      if (actionType === 'approve') {
        await withdrawalService.approveWithdrawal(id);
      } else if (actionType === 'disburse') {
        const disburseData = JSON.parse(await request.text());
        await withdrawalService.disburseWithdrawal(id, disburseData);
      } else if (actionType === 'process') {
        await withdrawalService.processWithdrawal(id);
      }
    } else if (method === 'DELETE') {
      const pathParts = new URL(request.url).pathname.split('/');
      const id = Number(pathParts[pathParts.length - 1]);
      await withdrawalService.deleteWithdrawal(id);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
