import { Heading } from '@repo/shadcn/heading';

export function UsersHeader() {
  return (
    <div className="flex items-center justify-between">
      <Heading
        title="Usuarios"
        description="Gestiona los usuarios del sistema"
      />
    </div>
  );
}
