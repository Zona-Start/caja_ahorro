import type { ColumnDef } from '@tanstack/react-table';
import type { ModuleSetting } from '../../schemas/module-settings.schema';
import { ModuleSettingsCellAction } from './module-settings-cell-action';

const baseColumns: ColumnDef<ModuleSetting>[] = [
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

export function createModuleSettingsColumns(
  isSuperAdmin: boolean,
  tenantNames?: Record<string, string>,
): ColumnDef<ModuleSetting>[] {
  if (!isSuperAdmin) return baseColumns;

  return [
    {
      accessorKey: 'tenantId',
      header: 'Cliente',
      cell: ({ row }) => {
        const name = tenantNames?.[row.original.tenantId];
        return (
          <span className="truncate block max-w-[200px]" title={name ?? row.original.tenantId}>
            {name ?? row.original.tenantId.slice(0, 8) + '...'}
          </span>
        );
      },
    },
    ...baseColumns,
  ];
}