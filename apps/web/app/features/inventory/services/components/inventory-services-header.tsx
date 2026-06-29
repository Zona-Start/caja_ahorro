import { Heading } from '@repo/shadcn/heading';

export function InventoryServicesHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Servicios"
        description="Gestiona los servicios en el sistema"
      />
    </div>
  );
}
