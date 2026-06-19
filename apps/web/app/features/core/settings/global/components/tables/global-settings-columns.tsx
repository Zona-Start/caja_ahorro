import { Badge } from '@repo/shadcn/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { GlobalSetting } from '../../schemas/global-settings.schema';
import { GlobalSettingsCellAction } from './global-settings-cell-action';

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  notification: 'Notificaciones',
  security: 'Seguridad',
};

export const globalSettingsColumns: ColumnDef<GlobalSetting>[] = [
  {
    accessorKey: 'key',
    header: 'Clave',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate block" title={row.original.value}>
        {row.original.value}
      </span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || 'N/A',
  },
  {
    accessorKey: 'category',
    header: 'Categoría',
    cell: ({ row }) => (
      <Badge variant="outline">
        {CATEGORY_LABELS[row.original.category ?? 'general'] ?? row.original.category}
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
        <GlobalSettingsCellAction data={row.original} />
      </div>
    ),
  },
];