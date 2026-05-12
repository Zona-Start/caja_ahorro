export const STATUS_TYPES = [
  { value: 'AVAILABLE', label: 'Disponible' },
  { value: 'DISABLED', label: 'Deshabilitado' },
  { value: 'OUT_OF_STOCK', label: 'Agotado' },
  { value: 'COMMING_SOON', label: 'Próximamente' },
  { value: 'ON_SALE', label: 'En oferta' },
] as const;

export const UNIT_MEASURES = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'KG', label: 'Kilogramo' },
  { value: 'LITER', label: 'Litro' },
  { value: 'METER', label: 'Metro' },
  { value: 'PACK', label: 'Paquete' },
  { value: 'BOX', label: 'Caja' },
] as const;
