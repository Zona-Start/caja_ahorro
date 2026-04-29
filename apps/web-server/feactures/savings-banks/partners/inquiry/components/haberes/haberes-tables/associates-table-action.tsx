// 'use client';
// import { Button } from '@repo/shadcn/button';
// import { DataTableFilterBox } from '@repo/shadcn/table/data-table-filter-box';
// import { DataTableSearch } from '@repo/shadcn/table/data-table-search';
// import { Plus } from 'lucide-react';
// import { useState } from 'react';
// import { AssociatesModal } from '../associates-modal';
// import {
//   ESTATUS_OPTIONS,
//   PAYROLL_OPTIONS,
//   useAssociatesTableFilters,
// } from './use-associates-filters';

// export default function AssociatesTableAction() {
//   const {
//     statusFilter,
//     setStatusFilter,
//     payrollFilter,
//     setPayrollFilter,
//     searchQuery,
//     setPage,
//     setSearchQuery,
//   } = useAssociatesTableFilters();

//   const [open, setOpen] = useState(false);

//   return (
//     <div className="flex items-center justify-between mt-4 ">
//       <div className="flex items-center gap-4 flex-grow">
//         <DataTableSearch
//           title="Buscar por nombre o cédula"
//           searchKey={String(/^\d/.test(searchQuery || ''))}
//           searchQuery={searchQuery || ''}
//           setSearchQuery={setSearchQuery}
//           setPage={setPage}
//         />
//         <DataTableFilterBox
//           filterKey="Por estatus"
//           title="Estatus"
//           options={ESTATUS_OPTIONS}
//           setFilterValue={setStatusFilter}
//           filterValue={statusFilter}
//         />
//         <DataTableFilterBox
//           filterKey="payroll"
//           title="Por CrediNomina"
//           options={PAYROLL_OPTIONS}
//           setFilterValue={setPayrollFilter}
//           filterValue={payrollFilter}
//         />
//       </div>
//       <Button onClick={() => setOpen(true)} size="sm">
//         <Plus className="mr-2 h-4 w-4" /> Agregar socio
//       </Button>

//       <AssociatesModal open={open} onOpenChange={setOpen} />
//     </div>
//   );
// }
