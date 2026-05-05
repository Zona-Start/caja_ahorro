import { type ActionFunctionArgs } from 'react-router';
import { paymentBatchService } from '../services/payment-batch-service';
import { createPaymentBatchSchema, confirmPaymentBatchSchema } from '../schemas/payment-batch-schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;

  try {
    if (method === 'POST') {
      const data = Object.fromEntries(formData);
      // Transformación necesaria según el schema
      const dto = createPaymentBatchSchema.parse({
        bankAccountId: Number(data.bankAccountId),
        currencyCode: data.currencyCode,
        description: data.description,
        items: JSON.parse(data.items as string),
      });
      await paymentBatchService.createPaymentBatch(dto);
    } else if (method === 'PATCH') {
      const pathParts = new URL(request.url).pathname.split('/');
      const id = Number(pathParts[pathParts.length - 2]); // Depende de la estructura de rutas
      const actionType = pathParts[pathParts.length - 1];

      if (actionType === 'confirm') {
        const dto = confirmPaymentBatchSchema.parse(JSON.parse(await request.text()));
        await paymentBatchService.confirmPaymentBatch(id, dto);
      } else if (actionType === 'uploaded') {
        await paymentBatchService.markAsUploaded(id);
      } else if (actionType === 'cancel') {
        await paymentBatchService.cancelPaymentBatch(id);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
