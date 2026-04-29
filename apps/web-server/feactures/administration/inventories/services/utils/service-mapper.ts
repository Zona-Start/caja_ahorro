export function mapServiceApiToForm(data: any) {
  if (data.length === 0) {
    return [];
  }
  return data.map((item: any) => {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      serviceCode: item.serviceCode,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      status: item.status,
      supplierCost: item.supplierCost ? Number(item.supplierCost) : 0,
      otherCosts: item.otherCosts ? Number(item.otherCosts) : 0,
      purchaseTax: item.purchaseTax ? Number(item.purchaseTax) : 0,
    };
  });
}
