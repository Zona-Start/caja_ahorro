import type { ColumnDef } from '@tanstack/react-table';
import { TenantSetting } from '../../schemas/tenant-settings.schema';
import { TenantSettingsCellAction } from './tenant-settings-cell-action';

export const tenantSettingsColumns: ColumnDef<TenantSetting>[] = [
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => {
      const raw = row.original.value;
      const display = raw === 'true'
        ? 'Sí'
        : raw === 'false'
          ? 'No'
          : raw === 'VES'
            ? 'Bolivar'
            : raw === 'USD'
              ? 'Dolar'
              : raw === 'EUR'
                ? 'Euro'
                : (raw || '(sin valor)');
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