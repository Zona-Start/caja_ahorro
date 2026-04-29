import { Heading } from '@repo/shadcn/heading';

export function InventoryCategoriesHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Categorías de Inventario"
          description="Gestiona las categorías de inventario"
        />
      </div>
    </>
  );
}
