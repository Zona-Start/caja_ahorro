import { type ActionFunctionArgs } from 'react-router';
import { loansManagementService } from '../services/loans-management-service';
import { loanManagementSchema } from '../schemas/loans-management.schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  
  try {
    if (method === 'POST') {
      const payload = loanManagementSchema.parse(JSON.parse(formData.get('payload') as string));
      await loansManagementService.createLoansManagement(payload);
    } else if (method === 'PATCH') {
      const pathParts = new URL(request.url).pathname.split('/');
      const id = Number(pathParts[pathParts.length - 2]);
      await loansManagementService.approveLoansManagement(id);
    } else if (method === 'DELETE') {
      const pathParts = new URL(request.url).pathname.split('/');
      const id = Number(pathParts[pathParts.length - 1]);
      await loansManagementService.deleteLoansManagement(id);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
