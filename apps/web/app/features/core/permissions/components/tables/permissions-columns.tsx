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

const SCOPE_STYLES: Record<string, string> = {
  own: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  team: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  department: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  branch: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  tenant: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
  global: 'bg-rose-100 text-rose-800 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400',
  all: 'bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
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
    cell: ({ row }) => {
      const scope = row.original?.scope ?? null;
      const scopeKey = scope || 'own';
      return (
        <Badge
          variant="outline"
          className={SCOPE_STYLES[scopeKey] ?? ''}
        >
          {getScopeLabel(scope)}
        </Badge>
      );
    },
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
