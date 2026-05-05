import { type ActionFunctionArgs } from 'react-router';
import { typeCreditsService } from '../services/type-credits-service';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = Number(pathParts[pathParts.length - 1]);

  try {
    if (method === 'POST') {
      const payload = JSON.parse(formData.get('payload') as string);
      await typeCreditsService.create(payload);
    } else if (method === 'PUT') {
      const payload = JSON.parse(formData.get('payload') as string);
      await typeCreditsService.update(id, payload);
    } else if (method === 'DELETE') {
      await typeCreditsService.delete(id);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
