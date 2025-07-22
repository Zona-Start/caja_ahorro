import { Service } from '../schemas/service.schema';

export function mapServiceApiToForm(data: any): Service {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    suppliersId: data.suppliersId,
    defaultCost: data.defaultCost,
    status: data.status,
  };
}
