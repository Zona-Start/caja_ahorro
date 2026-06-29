import { QueryClient } from '@tanstack/react-query';
import { type ClientActionFunctionArgs } from 'react-router';
import { creditManagementService } from '../services/credits-management-service';

export const creditManagementAction =
  (queryClient: QueryClient) =>
  async ({ request }: ClientActionFunctionArgs) => {
    const formData = await request.formData();
    const intent = formData.get('_intent');

    if (intent === 'approve') {
      const id = formData.get('id') as string;
      await creditManagementService.approveCreditManagement(id);
    }

    if (intent === 'delete') {
      const id = formData.get('id') as string;
      await creditManagementService.deleteCreditManagement(id);
    }

    if (intent === 'create') {
      const payload = Object.fromEntries(formData);
      await creditManagementService.createCreditManagement(payload);
    }

    await queryClient.invalidateQueries({ queryKey: ['creditManagements'] });

    return { success: true };
  };
