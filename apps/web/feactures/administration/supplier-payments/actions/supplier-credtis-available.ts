'use server';
import { safeFetchApi } from '@/lib/fetch.api';
import { supplierAdvancedCreditSchema } from '../schemas';

//action para consultar los creditos disponibles de un proveedor
export const supplierAvailableCreditAction = async (id: number) => {
  const [error, data] = await safeFetchApi(
    supplierAdvancedCreditSchema,
    `/administration/supplier-payments/supplier-available-credits/${id}`,
    'GET',
  );

  if (error) {
    console.error('Error:', error);
    throw new Error(error.message || 'Error updating supplier invoice');
  }

  const mapper = data?.data?.map((item: any) => {
    const credit = item.credits.map((credit: any) => {
      return {
        cxpId: credit.cxpId,
        cxpNumber: credit.cxpNumber,
        amount: Math.abs(credit.amount),
        origin: credit.origin,
      };
    });

    return {
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      taxId: item.taxId,
      currencyCode: item.currencyCode,
      availableCredit: Math.abs(item.availableCredit),
      credits: credit,
    };
  });

  return {
    data: mapper,
  };
};
