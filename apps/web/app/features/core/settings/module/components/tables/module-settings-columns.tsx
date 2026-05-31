import type { ColumnDef } from '@tanstack/react-table';
import { ModuleSetting } from '../../schemas/module-settings.schema';
import { ModuleSettingsCellAction } from './module-settings-cell-action';

export const moduleSettingsColumns: ColumnDef<ModuleSetting>[] = [
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || 'N/A',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => {
      const raw = row.original.value;
      const display = raw === 'true' ? 'Sí' : raw === 'false' ? 'No' : raw;
      return (
        <span className="max-w-[200px] truncate block" title={display}>
          {display}
        </span>
      );
    },
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