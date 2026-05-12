import { Heading } from '@repo/shadcn/heading';

export function SuppliersHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Proveedores"
        description="Gestiona los proveedores del sistema"
      />
    </div>
  );
}
