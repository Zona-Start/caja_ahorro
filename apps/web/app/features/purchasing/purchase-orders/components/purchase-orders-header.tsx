import { Heading } from '@repo/shadcn/heading';

export function PurchaseOrdersHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Órdenes de Compra"
        description="Gestiona las órdenes de compra"
      />
    </div>
  );
}
