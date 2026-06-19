import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { User } from '../../schemas/users.schema';
import { UsersCellAction } from './users-cell-action';

const getStatusBadgeVariant = (status?: string) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'secondary';
    case 'blocked':
      return 'destructive';
    default:
      return 'default';
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'inactive':
      return 'Inactivo';
    case 'blocked':
      return 'Bloqueado';
    default:
      return 'Desconocido';
  }
};

export const usersColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'username',
    header: 'Usuario',
  },
  {
    accessorKey: 'fullname',
    header: 'Nombre Completo',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {getStatusLabel(status)}
        </Badge>
      );
    },
  },
  {
    id: 'tenant',
    accessorFn: (row) => row.tenantMembers?.[0]?.tenant?.name || '',
    header: 'Empresa',
    cell: ({ row }) => {
      const members = row.original.tenantMembers || [];
      const tenantName = members[0]?.tenant?.name || 'N/A';
      return <span className="truncate max-w-[150px]">{tenantName}</span>;
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <UsersCellAction data={row.original} />
      </div>
    ),
  },
];