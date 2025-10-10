// 'use server';
// import { env } from '@/lib/env'; // Importamos la configuración de entorno validada
// import axios from 'axios';
// import { z } from 'zod';

// // Crear instancia de Axios con la URL base validada
// const fetchApi = axios.create({
//   baseURL: env.API_URL, // Aquí usamos env.API_URL en vez de process.env.BACKEND_URL
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// /**
//  * Función para hacer peticiones con validación de respuesta
//  * @param schema - Esquema de Zod para validar la respuesta
//  * @param url - Endpoint a consultar
//  * @param config - Configuración opcional de Axios
//  * @returns [error, data] -> Devuelve el error como objeto estructurado si hay fallo, o los datos validados
//  */
// export const safeFetchRefresh = async <T extends z.ZodSchema<any>>(
//   schema: T | null,
//   url: string,
//   method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
//   body?: any,
// ): Promise<
//   [{ type: string; message: string; details?: any } | null, z.infer<T> | null]
// > => {
//   const { auth } = await import('@/lib/auth');
//   const session = await auth();
//   const id = session?.user.id;
//   const dataBody = {
//     refreshToken: body.token,
//     userId: Number(id),
//   };

//   try {
//     const response = await fetchApi({
//       method,
//       url,
//       data: dataBody,
//     });

//     const parsed = schema?.safeParse(response.data) ?? null;

//     if (!parsed?.success) {
//       console.error('Validation Error Details:', {
//         errors: {
//           errors: parsed?.error.errors,
//           path: parsed?.error.errors[0]?.path,
//         },
//         receivedData: response.data,
//         data: response.data.data,
//       });
//       return [
//         {
//           type: 'VALIDATION_ERROR',
//           message: 'Validation error',
//           details: parsed?.error.errors,
//         },
//         null,
//       ];
//     }

//     return [null, parsed.data];
//   } catch (error: any) {
//     const errorDetails = {
//       status: error.response?.status,
//       statusText: error.response?.statusText,
//       message: error.message,
//       url: error.config?.url,
//       method: error.config?.method,
//       requestData: error.config?.data,
//       responseData: error.response?.data,
//       headers: error.config?.headers,
//     };

//     return [
//       {
//         type: 'API_ERROR',
//         message: error.response?.data?.message || 'Unknown API error',
//         details: errorDetails,
//       },
//       null,
//     ];
//   }
// };

// export { fetchApi };

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
