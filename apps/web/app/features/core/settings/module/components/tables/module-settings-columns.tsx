import type { ColumnDef } from '@tanstack/react-table';
import { ModuleSetting } from '../../schemas/module-settings.schema';
import { ModuleSettingsCellAction } from './module-settings-cell-action';

export const moduleSettingsColumns: ColumnDef<ModuleSetting>[] = [
  {
    accessorKey: 'module',
    header: 'Módulo',
  },
  {
    accessorKey: 'submodule',
    header: 'Submódulo',
    cell: ({ row }) => row.original.submodule || 'N/A',
  },
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
    id: 'actions',
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <ModuleSettingsCellAction data={row.original} />
      </div>
    ),
  },
];