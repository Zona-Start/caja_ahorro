export const CATEGORY_OPTIONS = [
  { label: 'Materia Prima', value: 'raw_material' },
  { label: 'Productos Terminados', value: 'finished_goods' },
  { label: 'Servicios', value: 'services' },
  { label: 'Equipos', value: 'equipment' },
  { label: 'Suministros', value: 'supplies' },
  { label: 'Otros', value: 'other' },
] as const;

export const STATUS_OPTIONS = [
  { label: 'Activo', value: 'active' },
  { label: 'Inactivo', value: 'inactive' },
  { label: 'Suspendido', value: 'suspended' },
  { label: 'En Revisión', value: 'under_review' },
] as const;
