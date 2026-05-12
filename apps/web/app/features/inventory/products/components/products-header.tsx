import { Heading } from '@repo/shadcn/heading';

export function ProductsHeader() {
  return (
    <div className="flex items-start justify-between">
      <Heading
        title="Productos"
        description="Gestiona los productos del inventario"
      />
    </div>
  );
}
