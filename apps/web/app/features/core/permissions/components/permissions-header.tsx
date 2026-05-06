import { Heading } from '@repo/shadcn/heading';

export function PermissionsHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Permisos Globales"
        description="Gestiona los permisos globales del sistema"
      />
    </div>
  );
}
