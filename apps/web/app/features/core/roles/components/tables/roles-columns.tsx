import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { Role } from '../../schemas/roles.schema';
import { RolesCellAction } from './roles-cell-action';

export const rolesColumns: ColumnDef<Role>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || 'N/A',
  },
  {
    accessorKey: 'rolePermissions',
    header: 'Permisos',
    cell: ({ row }) => {
      const permissions = row.original.rolePermissions || [];
      return (
        <Badge variant="outline">
          {permissions.length} permisos
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isDefault',
    header: 'Por Defecto',
    cell: ({ row }) => (
      <Badge variant={row.original.isDefault ? 'default' : 'secondary'}>
        {row.original.isDefault ? 'Sí' : 'No'}
      </Badge>
    ),
  },
  {
    id: 'tenant',
    accessorFn: (row) => row.tenant?.name || row.tenantId || '',
    header: 'Empresa',
    cell: ({ row }) => row.original.tenant?.name || row.original.tenantId || 'N/A',
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <RolesCellAction data={row.original} />
      </div>
    ),
  },
];
