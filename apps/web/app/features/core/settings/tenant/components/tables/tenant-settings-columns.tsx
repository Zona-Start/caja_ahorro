import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import { TenantSetting } from '../../schemas/tenant-settings.schema';
import { TenantSettingsCellAction } from './tenant-settings-cell-action';

export const tenantSettingsColumns: ColumnDef<TenantSetting>[] = [
  {
    accessorKey: 'key',
    header: 'Clave',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => (
      <span className="max-w-[250px] truncate block" title={row.original.value || ''}>
        {row.original.value || '(sin valor)'}
      </span>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.category || 'general'}
      </Badge>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Última Actualización',
    cell: ({ row }) =>
      row.original.updatedAt
        ? new Date(row.original.updatedAt).toLocaleDateString('es-ES')
        : 'N/A',
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <TenantSettingsCellAction data={row.original} />
      </div>
    ),
  },
];