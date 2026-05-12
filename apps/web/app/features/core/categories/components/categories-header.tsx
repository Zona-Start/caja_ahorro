import { Heading } from '@repo/shadcn/heading';

export function CategoriesHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Categorías"
        description="Gestiona las categorías del sistema."
      />
    </div>
  );
}