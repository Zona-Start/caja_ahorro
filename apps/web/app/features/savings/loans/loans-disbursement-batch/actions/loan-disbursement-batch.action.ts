import { type ActionFunctionArgs } from 'react-router';
import { loanDisbursementBatchService } from '../services/loan-disbursement-batch-service';
import { createLoanDisbursementBatchSchema, confirmLoanDisbursementBatchSchema } from '../schemas/loan-disbursement-batch.schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  
  try {
    if (method === 'POST') {
      const payload = createLoanDisbursementBatchSchema.parse(JSON.parse(formData.get('payload') as string));
      await loanDisbursementBatchService.createLoanDisbursementBatch(payload);
    } else if (method === 'PATCH') {
      const pathParts = new URL(request.url).pathname.split('/');
      const id = Number(pathParts[pathParts.length - 2]);
      const actionType = pathParts[pathParts.length - 1];

      if (actionType === 'confirm') {
        const dto = confirmLoanDisbursementBatchSchema.parse(JSON.parse(await request.text()));
        await loanDisbursementBatchService.confirmLoanDisbursementBatch(id, dto);
      } else if (actionType === 'upload') {
        await loanDisbursementBatchService.markAsUploaded(id);
      } else if (actionType === 'cancel') {
        await loanDisbursementBatchService.cancelLoanDisbursementBatch(id);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
