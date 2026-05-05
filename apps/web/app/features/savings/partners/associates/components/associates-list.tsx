import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { useAssociatesQuery } from '../hooks/use-associates-query';
import { columns } from './associates-tables/columns';
import { useAssociatesFilters } from '../hooks/use-associates-filters';

export default function AssociatesList() {
  const { filters } = useAssociatesFilters();
  const { data, isLoading } = useAssociatesQuery(filters);

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} rowCount={filters.limit} />;
  }

  return (
    <DataTable
      columns={columns}
      data={(data?.data || []).map((item) => ({
        ...item,
        birthdate: new Date(item.birthdate),
        dateAdmission: new Date(item.dateAdmission),
        dateGraduation: item.dateGraduation
          ? new Date(item.dateGraduation)
          : undefined,
      }))}
      totalItems={data?.meta.totalCount || 0}
      pageSizeOptions={[10, 20, 30, 40, 50]}
    />
  );
}
