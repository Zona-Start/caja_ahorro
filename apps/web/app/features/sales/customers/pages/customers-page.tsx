import { Badge } from '@repo/shadcn/badge';
import { Button } from '@repo/shadcn/button';
import { Heading } from '@repo/shadcn/heading';
import { Input } from '@repo/shadcn/input';
import { DataTable } from '@repo/shadcn/table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Plus, Search, UserX } from 'lucide-react';
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';
import { CustomerModal } from '../../components/customer-modal';
import {
  useCustomersPaginated,
} from '../../hooks/use-sales-queries';
import { useToggleCustomerMutation } from '../../hooks/use-sales-mutations';
import type { Customer } from '../../schemas/sales.schema';

export default function CustomersPage() {
  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault(''),
  );
  const [searchInput, setSearchInput] = useState(search);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) setSearch(searchInput || null);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, setSearch]);

  const { data } = useCustomersPaginated({
    page,
    limit,
    search: search || undefined,
  });

  const toggleMutation = useToggleCustomerMutation();

  const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'name', header: 'Nombre' },
    { accessorKey: 'taxId', header: 'Cédula / RIF' },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => row.original.phone || '—',
    },
    {
      accessorKey: 'isActive',
      header: 'Estado',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
          {row.original.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(row.original);
              setModalOpen(true);
            }}
          >
            <Pencil className="mr-1 h-4 w-4" /> Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            disabled={toggleMutation.isPending}
            onClick={() => toggleMutation.mutate(row.original.id)}
          >
            <UserX className="mr-1 h-4 w-4" />
            {row.original.isActive ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Heading
          title="Clientes"
          description="Directorio simple: nombre, cédula, teléfono y dirección."
        />
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          className="pl-8"
          placeholder="Buscar por nombre o cédula"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalItems={data?.meta.totalCount ?? 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <CustomerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        customer={editing}
      />
    </div>
  );
}
