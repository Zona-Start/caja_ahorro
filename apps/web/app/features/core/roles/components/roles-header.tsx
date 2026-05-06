import { Heading } from '@repo/shadcn/heading';

export function RolesHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Roles y permisos"
        description="Gestiona los roles y permisos del sistema"
      />
    </div>
  );
}
