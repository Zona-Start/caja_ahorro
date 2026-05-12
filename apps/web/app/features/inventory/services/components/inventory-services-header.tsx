import { Heading } from '@repo/shadcn/heading';

export function InventoryServicesHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Servicios de Inventario"
        description="Gestiona los servicios ofrecidos en tu inventario"
      />
    </div>
  );
}
