import { apiClient } from '@/lib/api-client';

export interface UploadedFile {
  key: string;
  url: string;
}

export const storageService = {
  /**
   * Sube un archivo a Cloudflare R2 a través del backend.
   * @param file Archivo a subir (imagen o PDF)
   * @param folder Carpeta destino dentro del bucket (ej. "expenses/receipts")
   */
  upload: async (file: File, folder = 'general'): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post<UploadedFile>(
      '/storage/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    return response.data;
  },
};
