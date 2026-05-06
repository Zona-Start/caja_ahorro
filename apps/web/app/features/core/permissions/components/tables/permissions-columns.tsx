import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ACTION_OPTIONS,
  RESOURCE_OPTIONS,
  SCOPE_OPTIONS,
} from '../../schemas/permission.option';
import { Permission } from '../../schemas/permissions.schema';
import { PermissionsCellAction } from './permissions-cell-action';

const getActionLabel = (value: string) => {
  return ACTION_OPTIONS.find((opt) => opt.value === value)?.label || value;
};

const getResourceLabel = (value: string) => {
  return RESOURCE_OPTIONS.find((opt) => opt.value === value)?.label || value;
};

const getScopeLabel = (value: string | null) => {
  return (
    SCOPE_OPTIONS.find((opt) => opt.value === value)?.label || value || 'Propio'
  );
};

export const permissionsColumns: ColumnDef<Permission>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'resource',
    header: 'Recurso',
    cell: ({ row }) => getResourceLabel(row.original.resource),
  },
  {
    accessorKey: 'action',
    header: 'Acción',
    cell: ({ row }) => getActionLabel(row.original.action),
  },
  {
    accessorKey: 'scope',
    header: 'Alcance',
    cell: ({ row }) => getScopeLabel(row.original?.scope ?? null),
  },
  // {
  //   accessorKey: 'description',
  //   header: 'Descripción',
  //   cell: ({ row }) => row.original.description || 'N/A',
  // },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'success' : 'secondary'}>
        {row.original.isActive ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <PermissionsCellAction data={row.original} />
      </div>
    ),
  },
];
