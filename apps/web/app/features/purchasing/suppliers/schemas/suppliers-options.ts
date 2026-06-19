export const CATEGORY_OPTIONS = [
  { label: 'Materia Prima', value: 'raw_material' },
  { label: 'Productos Terminados', value: 'finished_goods' },
  { label: 'Servicios', value: 'services' },
  { label: 'Equipos', value: 'equipment' },
  { label: 'Suministros', value: 'supplies' },
  { label: 'Otros', value: 'other' },
] as const;

export const STATUS_OPTIONS = [
  { label: 'Activo', value: 'ACTIVE' },
  { label: 'Inactivo', value: 'INACTIVE' },
] as const;

export const VENEZUELAN_STATES = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas',
  'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital',
  'Falcón', 'Guárico', 'Lara', 'La Guaira', 'Mérida',
  'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
  'Táchira', 'Trujillo', 'Yaracuy', 'Zulia',
] as const;
