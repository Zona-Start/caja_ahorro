import { Heading } from '@repo/shadcn/heading';

export function FixedAssetCategoriesHeader() {
  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Tipos de Categorias de Bienes"
          description="Gestiona los tipos de bienes de la caja"
        />
      </div>
    </>
  );
}
