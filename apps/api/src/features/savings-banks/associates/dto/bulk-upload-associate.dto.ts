export class BulkUploadAssociateDto {
  // Sin campos: el DTO solo representa el contexto de la operación.
  // El archivo llega como un buffer desde multer.
}

export interface BulkUploadResult {
  total: number;
  inserted: number;
  skipped: number;
}
