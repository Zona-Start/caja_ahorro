"use server"
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
 * @returns [error, data] -> Devuelve el error como string si hay fallo, o los datos validados
 */
export const safeFetchApi = async <T extends z.ZodSchema<any>>(
  schema: T,
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
): Promise<[string | null, z.infer<T> | null]> => {

  try {
    const response = await fetchApi({
      method,
      url,
      data: body,
    });

    const parsed = schema.safeParse(response.data);

    if (!parsed.success) {
      return [`Validation error: ${parsed.error.message}`, null];
    }

    return [null, parsed.data];
  } catch (error: any) {
    return [`API error: ${error.response?.status} - ${error.message}`, null];
  }
};

export { fetchApi };
