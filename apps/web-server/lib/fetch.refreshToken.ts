'use server';
import { env } from '@/lib/env';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';

/* ---------- 1. Tipo para el body de la petición ---------- */
type JsonBody = Record<string, unknown> | Record<string, unknown>[] | undefined;

/* ---------- 2. Tipo para el resultado de safeFetchApi ---------- */
type FetchError = {
  type: string;
  message: string;
  details?: unknown;
};

/* ---------- 3. Axios instance ---------- */
const fetchApi = axios.create({
  baseURL: env.API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/* ---------- 5. safeFetchApi totalmente tipada ---------- */
export const safeFetchRefresh = async <T>(
  schema: z.ZodSchema<T> | null,
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: JsonBody,
): Promise<[FetchError | null, T | null]> => {
  try {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const id = session?.user.id;
    const dataBody = {
      refreshToken: (body as Record<string, unknown> | undefined)?.token,
      userId: Number(id),
    };

    const response = await fetchApi({
      method,
      url,
      data: dataBody,
    });

    if (!schema) return [null, response.data as T];

    const parsed = schema.safeParse(response.data);
    if (!parsed.success) {
      console.error('Validation Error Details:', {
        errors: parsed.error.errors,
        receivedData: response.data,
      });
      return [
        {
          type: 'VALIDATION_ERROR',
          message: 'Validation error',
          details: parsed.error.errors,
        },
        null,
      ];
    }
    return [null, parsed.data];
  } catch (err) {
    const axiosError = err as AxiosError;

    return [
      {
        type: 'API_ERROR',
        message:
          (axiosError.response?.data as { message?: string })?.message ||
          'Unknown API error',
        details: {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          message: axiosError.message,
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          requestData: axiosError.config?.data,
          responseData: axiosError.response?.data,
          headers: axiosError.config?.headers,
        },
      },
      null,
    ];
  }
};

export { fetchApi };
