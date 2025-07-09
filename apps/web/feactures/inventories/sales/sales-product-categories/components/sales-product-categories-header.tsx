import { Heading } from '@repo/shadcn/heading';

export function SalesProductCategoriesHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Categorias de Productos"
          description="Gestiona los tipos de categorias de productos"
        />
      </div>
    </>
  );
}
