'use server';
import { env } from '@/lib/env'; // Importamos la configuración de entorno validada
import axios from 'axios';
import { z } from 'zod';

// Crear instancia de Axios con la URL base validada
const fetchApi = axios.create({
  baseURL: env.API_URL, // Aquí usamos env.API_URL en vez de process.env.BACKEND_URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token automáticamente en las peticiones
fetchApi.interceptors.request.use(async (config: any) => {
  try {
    // Importación dinámica para evitar la referencia circular
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    const token = session?.access_token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }

  return config;
});

/**
 * Función para hacer peticiones con validación de respuesta
 * @param schema - Esquema de Zod para validar la respuesta
 * @param url - Endpoint a consultar
 * @param config - Configuración opcional de Axios
 * @returns [error, data] -> Devuelve el error como objeto estructurado si hay fallo, o los datos validados
 */
export const safeFetchApi = async <T extends z.ZodSchema<any>>(
  schema: T,
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
): Promise<
  [{ type: string; message: string; details?: any } | null, z.infer<T> | null]
> => {
  try {
    const response = await fetchApi({
      method,
      url,
      data: body,
    });

    const parsed = schema.safeParse(response.data);

    if (!parsed.success) {
      console.error('Validation Error Details:', {
        errors: parsed.error.errors,
        receivedData: response.data,
        expectedSchema: schema,
        data: response.data.data,
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
  } catch (error: any) {
    const errorDetails = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data,
      responseData: error.response?.data,
      headers: error.config?.headers,
    };

    return [
      {
        type: 'API_ERROR',
        message: error.response?.data?.message || 'Unknown API error',
        details: errorDetails,
      },
      null,
    ];
  }
};

export { fetchApi };
