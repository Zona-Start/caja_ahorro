---
name: frontend-skill
description: Este documento establece los **estándares obligatorios** para el desarrollo de módulos en la aplicación web. Cualquier agente de IA o desarrollador debe seguir esta guía para garantizar consistencia, reactividad nativa, escalabilidad y mantenibilidad.
---

# 🌐 Especificación de Arquitectura Frontend: Web (React Router v7)

## Stack Tecnológico Mandatorio
- **Core:** React Router v7 (Modo SPA / Client-Only)
- **Data Fetching & Cache:** TanStack Query (v5)
- **State URL Manager:** nuqs
- **UI & Components:** shadcn/ui, TanStack Table, DaisyUI, PrimVue
- **Formularios & Validación:** react-hook-form, zod, @hookform/resolvers
- **Estilos & Iconos:** Tailwind CSS, lucide-react
- **Utilidades:** axios, sonner, date-fns, zustand (exclusivo para UI local)

---

## 📁 Estructura General del Proyecto (por features)

Las funcionalidades se agrupan por dominios de negocio (módulos). Está estrictamente prohibido esparcir la lógica de una misma entidad en carpetas globales.

```text
features/[modulo]/
├── components/
│   ├── [modulo]-table/
│   │   ├── [modulo]-columns.tsx        # Columnas, celdas complejas y dropdown de acciones
│   │   ├── [modulo]-filters-action.tsx # Componentes visuales de filtros
│   │   └── [modulo]-cell-actions.tsx   # Acciones individuales por fila (Editar, Eliminar)
│   ├── [modulo]-form.tsx               # Formulario unificado (Create/Edit/View)
│   ├── [modulo]-modal.tsx              # Radix/Shadcn Dialog que envuelve al formulario
│   ├── [modulo]-header.tsx             # Título del módulo, estadísticas rápidas y botón "Nuevo"
│   └── [modulo]-list.tsx               # Grid principal que consume la DataTable
├── hooks/
│   ├── use-[modulo]-filters.ts         # Sincronización de URL Parms (nuqs) y esquemas de validación
│   ├── use-[modulo]-queries.ts         # Custom hooks de useQuery con tipos anotados
│   └── use-[modulo]-mutations.ts       # Custom hooks de useMutation (invalidador global de caché)
├── keys/
│   └── index.ts                        # Query Keys locales del módulo
├── loaders/
│   ├── [modulo]-loader.ts              # clientLoader de React Router v7 (Precarga y extracción de URL)
│   └── [modulo]-action.ts              # clientAction de React Router v7 (Orquestador de mutaciones/envíos)
├── pages/
│   └── [modulo]-list-page.tsx          # Componente Vista que unifica la Query de entrada y la UI
├── schemas/
│   └── [modulo].schema.ts              # Esquemas de validación Zod (Entidades, Filtros, Mutations)
└── services/
│   └── [modulo]-api.ts                 # Instancia Axios con tipado estricto e interceptor de parseo Zod
1. Estructura de Navegación y Rutas
El proyecto utiliza el sistema de enrutamiento centralizado de React Router v7 en app/routes.ts.

1.1. Jerarquía de Layouts
Root Layout (/): Proveedores globales (TanStack Query Provider, ThemeProvider, NuqsAdapter).

Auth Layout (/login): Páginas públicas de autenticación desprovistas de Layout complejo.

Dashboard Layout (/dashboard): Layout administrativo protegido. Provee el AppSidebar, topbar y el <Outlet /> de renderizado de módulos.

1.2. Convención de URLs y Definición Modular
Para agregar una nueva ruta, se debe declarar en routes.ts usando el patrón modular:

TypeScript
// app/routes.ts
import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  route("dashboard/caja-ahorro", "layouts/dashboard-layout.tsx", [
    index("features/asociados/pages/asociados-list-page.tsx"),
    route("solicitudes", "features/solicitudes/pages/solicitudes-list-page.tsx"),
  ]),
] satisfies RouteConfig;
2. Gestión de Estado en la URL (nuqs)
Los filtros, términos de búsqueda, ordenamientos y paginaciones pertenecen a la URL para asegurar consistencia al compartir enlaces o recargar el navegador. Queda prohibido el uso de useState local para estos fines.

2.1. Reglas de Configuración de nuqs
Los parámetros en URL deben formatearse estrictamente en snake_case.

Propiedad Crítica: Se debe usar shallow: false. Esto asegura que al mutar la URL, React Router v7 detecte el cambio de estado e invoque de forma automática el ciclo de ejecución de los clientLoader de la ruta activa.

✅ Implementación del Hook de Filtros
TypeScript
// features/asociados/hooks/use-asociados-filters.ts
import { useQueryStates, parseAsInteger, parseAsString } from 'nuqs';
import { z } from 'zod';

// Esquema Zod de filtros expuesto obligatoriamente para validaciones en Loaders
export const asociadosFilterSchema = z.object({
  page: z.number().catch(1),
  search: z.string().catch(''),
  limit: z.number().catch(10),
});

export type AsociadosFilters = z.infer<typeof asociadosFilterSchema>;

export function useAsociadosFilters() {
  const [filters, setFilters] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    search: parseAsString.withDefault(''),
    limit: parseAsInteger.withDefault(10),
  }, { shallow: false }); // shallow: false es mandatorio para interceptar con clientLoader

  const clearFilters = () => setFilters({ page: 1, search: '', limit: 10 });

  return {
    filters,
    setFilters,
    clearFilters
  };
}
3. Flujo Coherente de Datos: React Router v7 + TanStack Query
Para evitar duplicidad de peticiones, desincronizaciones e hilos sueltos, la arquitectura implementa un flujo síncrono unificado:

[UI Interacción / Filtro] ➔ [nuqs muta URL (shallow: false)] ➔ [RRv7 ejecuta clientLoader]
                                                                        │
[UI renderiza con initialData] 🔀 [useQuery absorbe data] ◀── [clientLoader lee URL & ejecuta ensureQueryData]
3.1. Arquitectura del Localizador de Datos (clientLoader)
El loader se encarga de interceptar la petición antes de que la página se pinte, parsear los parámetros reales de la URL, e inyectarlos en la caché de TanStack Query usando ensureQueryData. Siempre debe retornar el objeto de datos.

TypeScript
// features/asociados/loaders/asociados-loader.ts
import { QueryClient } from '@tanstack/react-query';
import type { ClientLoaderArgs } from 'react-router';
import { asociadosKeys } from '../keys';
import { asociadosApiService } from '../services/asociados-api';
import { asociadosFilterSchema } from '../hooks/use-asociados-filters';

export const createAsociadosLoader = (queryClient: QueryClient) => async ({ request }: ClientLoaderArgs) => {
  const url = new URL(request.url);
  
  // Parseo y extracción segura de Query Params directo desde el objeto Request de RRv7
  const paramsParsed = asociadosFilterSchema.parse({
    page: Number(url.searchParams.get('page')) || undefined,
    search: url.searchParams.get('search') || undefined,
    limit: Number(url.searchParams.get('limit')) || undefined,
  });

  // Garantizar almacenamiento previo en caché
  const data = await queryClient.ensureQueryData({
    queryKey: asociadosKeys.list(paramsParsed),
    queryFn: () => asociadosApiService.getAll(paramsParsed),
  });

  return { data, filters: paramsParsed };
};
3.2. Gestión de Mutaciones (clientAction)
Las acciones que modifican el estado de la aplicación del lado del servidor se ejecutan a través de los formularios nativos o imperativos de React Router v7. Esto previene ejecuciones descontroladas y centraliza las invalidaciones.

TypeScript
// features/asociados/loaders/asociados-action.ts
import { QueryClient } from '@tanstack/react-query';
import { redirect, type ClientActionArgs } from 'react-router';
import { asociadosApiService } from '../services/asociados-api';
import { globalQueryKeys } from '~/lib/query-keys';

export const createAsociadoAction = (queryClient: QueryClient) => async ({ request }: ClientActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get('_intent');

  if (intent === 'create') {
    const payload = Object.fromEntries(formData);
    await asociadosApiService.create(payload);
  }

  if (intent === 'delete') {
    const id = formData.get('id') as string;
    await asociadosApiService.delete(id);
  }

  // Sincronizar e invalidar cachés globales de TanStack
  await queryClient.invalidateQueries({ queryKey: globalQueryKeys.asociados.lists() });
  
  return { success: true };
};
3.3. Consumo en Componente Vista (pages/)
La vista utiliza el hook useLoaderData para adquirir la data deshidratada del loader e inyectarla en el useQuery local mediante la propiedad initialData, logrando transiciones instantáneas sin parpadeos visuales ni spinners innecesarios.

TypeScript
// features/asociados/pages/asociados-list-page.tsx
import { useLoaderData } from 'react-router';
import { queryClient } from '~/lib/query-client';
import { useAsociadosFilters } from '../hooks/use-asociados-filters';
import { useAsociadosQuery } from '../hooks/use-asociados-queries';
import { createAsociadosLoader } from '../loaders/asociados-loader';
import { createAsociadoAction } from '../loaders/asociados-action';
import { DataTable } from '~/components/ui/data-table';
import { asociadosColumns } from '../components/asociados-table/asociados-columns';

// Configuración de exportaciones obligatorias de ruta para RRv7
export const clientLoader = createAsociadosLoader(queryClient);
export const clientAction = createAsociadoAction(queryClient);

export default function AsociadosListPage() {
  const { data: loaderData, filters: loaderFilters } = useLoaderData<typeof clientLoader>();
  const { filters } = useAsociadosFilters();

  // Sincronización transparente con TanStack Query
  const { data } = useAsociadosQuery(filters, {
    initialData: (filters.page === loaderFilters.page && filters.search === loaderFilters.search)
      ? loaderData.data
      : undefined,
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <DataTable 
        columns={asociadosColumns} 
        data={data?.data ?? []} 
        totalItems={data?.meta?.totalItems ?? 0}
      />
    </div>
  );
}
4. Estándares Fundamentales de UI y Modales CRUD
4.1. Gestión de Modales con Zustand
Zustand se utiliza exclusivamente para el manejo de estados visuales locales de la UI (abrir/cerrar modales, pasar payloads transitorios de edición). Los estados que pertenezcan a filtros jamás se guardan aquí.

TypeScript
// features/asociados/store/modal-store.ts
import { create } from 'zustand';

type ModalMode = 'create' | 'edit' | 'view';

interface AsociadoModalState {
  isOpen: boolean;
  mode: ModalMode;
  activeData?: any;
  openModal: (mode: ModalMode, data?: any) => void;
  closeModal: () => void;
}

export const useAsociadoModalStore = create<AsociadoModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  activeData: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, activeData: data }),
  closeModal: () => set({ isOpen: false, mode: 'create', activeData: undefined }),
}));
4.2. Disparos de Acciones en la Tabla (useSubmit)
Para desencadenar operaciones asíncronas desde componentes de UI profundos (como un botón de eliminación en una celda), se debe utilizar el hook useSubmit de React Router en lugar de llamadas directas a Axios, canalizando el flujo obligatoriamente por el clientAction.

TypeScript
// features/asociados/components/asociados-table/asociados-cell-actions.tsx
import { useSubmit } from 'react-router';
import { useAsociadoModalStore } from '../../store/modal-store';
import { toast } from 'sonner';

export function AsociadosCellActions({ rowData }: { rowData: any }) {
  const submit = useSubmit();
  const { openModal } = useAsociadoModalStore();

  const handleDelete = () => {
    if (confirm('¿Está seguro de eliminar este registro financiero?')) {
      const formData = new FormData();
      formData.append('id', rowData.id);
      formData.append('_intent', 'delete');
      
      submit(formData, { method: 'post' });
      toast.success('Petición de eliminación enviada.');
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={() => openModal('edit', rowData)}>Editar</button>
      <button onClick={handleDelete} className="text-red-500">Eliminar</button>
    </div>
  );
}
5. Mitigación de Errores Comunes (Gotchas Técnicos)
A. Debounce Obligatorio en Campos de Texto (Input)
Al vincular un <Input> a un filtro textual manejado por nuqs, nunca asocies el setFilters({ search: value }) directamente al evento onChange. Esto inducirá una recarga continua del clientLoader por cada pulsación de tecla, ocasionando pérdida de foco del cursor y degradación extrema del rendimiento.

Regla: Usa un useState local reflejado en el value del input y sincronízalo con un hook de debounce de 400ms antes de despachar el valor final a nuqs.

B. Sanitización Mandatoria de Esquemas (null vs undefined)
Los motores y bases de datos relacionales en el backend suelen mapear columnas vacías como null. Sin embargo, react-hook-form y los esquemas de validación de entradas de formularios esperan tipos string | undefined para campos opcionales.

Regla: Antes de setear los defaultValues en el formulario al abrir en modo edit, pasa el objeto por una función sanitizadora limpia (ej. toFormValues) que convierta cada propiedad null en un string vacío "" o undefined, evitando colisiones de tipado rígido en TypeScript.

C. Firmas de Query Keys Flexibles
En el archivo de definición de llaves locales [modulo]-keys.ts, al declarar el método de filtrado dinámico list: (filters: Type), nunca utilices tipados laxos u objetos planos genéricos como Record<string, unknown>. Las interfaces estrictas de TypeScript carecen de firmas de índice implícitas, lo que provocará fallos en tiempo de compilación. Provee tipos de datos específicos o constructores parciales (Partial<Filtros>).

TypeScript
export const asociadosKeys = {
  all: ['asociados'] as const,
  lists: () => [...asociadosKeys.all, 'list'] as const,
  list: (filters: AsociadosFilters) => [...asociadosKeys.lists(), filters] as const,
};
⚠️ Nota para Agentes de IA: Está terminantemente prohibido el uso del tipo any en cualquier archivo del módulo. El uso de validaciones Zod asíncronas es mandatorio en la capa de servicios de red (services/).