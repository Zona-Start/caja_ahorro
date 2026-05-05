import { type ActionFunctionArgs } from 'react-router';
import { creditManagementService } from '../services/credits-management-service';
import { creditManagementSchema } from '../schemas/credits-management.schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const actionType = pathParts[pathParts.length - 1];
  const id = Number(pathParts[pathParts.length - 2]);

  try {
    if (method === 'POST') {
      const payload = creditManagementSchema.parse(JSON.parse(formData.get('payload') as string));
      await creditManagementService.createCreditManagement(payload);
    } else if (method === 'PATCH' && actionType === 'approve') {
      await creditManagementService.approveCreditManagement(id);
    } else if (method === 'DELETE') {
      await creditManagementService.deleteCreditManagement(id);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
