import { apiClient } from '@/lib/api-client';

export interface StorageUploadResult {
  key: string;
  url: string;
}

export const storageService = {
  async upload(file: File, folder: string): Promise<StorageUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await apiClient.post<StorageUploadResult>(
      '/storage/upload',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    );

    return response.data;
  },
};
