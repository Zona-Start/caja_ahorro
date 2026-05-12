import { Heading } from '@repo/shadcn/heading';

export function CategoriesHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Categorías de Inventario"
        description="Gestiona las categorías de productos, servicios y activos fijos"
      />
    </div>
  );
}
