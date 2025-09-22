'use client';

import { useSystemConfigStore } from '@/store/SystemConfigStore';
import { ColumnDef } from '@tanstack/react-table';
import { SettingSystem } from '../../schemas/system-properties.schema';
import { CellAction } from './cell-action';

export const columns: ColumnDef<SettingSystem>[] = [
  {
    accessorKey: 'description',
    header: 'Nombre',
  },
  {
    accessorKey: 'value',
    header: 'Valor',
    cell: ({ row }) => {
      const { currencies } = useSystemConfigStore();
      const currency =
        row.original.key === 'MONEDA'
          ? currencies.find(
              (currency) => currency.id === Number(row.original.value),
            )
          : null;

      return row.original.key === 'MONEDA'
        ? currency?.name || 'Cargando...'
        : row.original.value;
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
