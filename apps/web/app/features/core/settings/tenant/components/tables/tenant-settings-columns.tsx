import type { ColumnDef } from '@tanstack/react-table';
import type { TenantSetting } from '../../schemas/tenant-settings.schema';
import { TenantSettingsCellAction } from './tenant-settings-cell-action';

const baseColumns: ColumnDef<TenantSetting>[] = [
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => {
      const raw = row.original.value;
      const display =
        raw === 'true'
          ? 'Sí'
          : raw === 'false'
            ? 'No'
            : raw === 'VES'
              ? 'Bolivar'
              : raw === 'USD'
                ? 'Dolar'
                : raw === 'EUR'
                  ? 'Euro'
                  : raw || '(sin valor)';
      return (
        <span className="max-w-[250px] truncate block" title={display}>
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
        <TenantSettingsCellAction data={row.original} />
      </div>
    ),
  },
];

export function createTenantSettingsColumns(
  isSuperAdmin: boolean,
  tenantNames?: Record<string, string>,
): ColumnDef<TenantSetting>[] {
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
