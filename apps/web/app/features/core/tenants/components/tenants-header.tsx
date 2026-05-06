import { Heading } from '@repo/shadcn/heading';

export function TenantsHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Clientes"
        description="Gestiona los clientes del sistema"
      />
    </div>
  );
}
