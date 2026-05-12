import { Heading } from '@repo/shadcn/heading';

export function InventoryFixedAssetsHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Activos Fijos"
        description="Gestiona el inventario de activos fijos de tu empresa"
      />
    </div>
  );
}
