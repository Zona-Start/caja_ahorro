import { type ActionFunctionArgs } from 'react-router';
import { settlementService } from '../services/settlement-service';
import { settlementSchema } from '../schemas/settlement.schema';
import { disburseSettlementSchema } from '../schemas/disburse-settlement.schema';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const method = request.method;
  
  try {
    if (method === 'POST') {
      const data = Object.fromEntries(formData);
      
      // Manejar el caso de aprobación o desembolso según la ruta
      const pathParts = new URL(request.url).pathname.split('/');
      const actionType = pathParts[pathParts.length - 1];
      const id = pathParts[pathParts.length - 2];

      if (actionType === 'approve') {
        await settlementService.approveSettlement(Number(id));
      } else if (actionType === 'disburse') {
        const disburseData = disburseSettlementSchema.parse({
          bankAccountId: Number(data.bankAccountId),
          bankReference: data.bankReference,
          transferDate: new Date(data.transferDate as string),
        });
        await settlementService.disburseSettlement(Number(id), disburseData);
      } else {
        // Crear liquidación
        const payload = settlementSchema.parse(JSON.parse(data.payload as string));
        await settlementService.saveSettlement(payload);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
