import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { Tenant } from '../../schemas/tenants.schema';
import { TenantsCellAction } from './tenants-cell-action';

export const tenantsColumns: ColumnDef<Tenant>[] = [
  {
    accessorKey: 'name',
    header: 'Nombre',
  },
  {
    accessorKey: 'rif',
    header: 'RIF',
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    cell: ({ row }) => row.original.phone || 'N/A',
  },
  {
    accessorKey: 'contactName',
    header: 'Contacto',
    cell: ({ row }) => row.original.contactName || 'N/A',
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? 'success' : 'destructive'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <TenantsCellAction data={row.original} />
      </div>
    ),
  },
];