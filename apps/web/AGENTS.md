Este documento establece los **estándares obligatorios** para el desarrollo de módulos en la aplicación web. Cualquier agente de IA o desarrollador debe seguir esta guía para garantizar consistencia, escalabilidad y mantenibilidad.

---

# 🌐 Especificación de Arquitectura Frontend: Web

(React Router v7)
tanstack table
tanstack query
shadcn ui
zustand
nuqs
zod
axios
sonner
date-fns
lucide-react
react-hook-form
hookform/resolvers

## 📁 Estructura General del Proyecto (por features)

```text
features/[modulo]/
├── components/
│   ├── [modulo]-table/
│   │   ├── [modulo]-columns.tsx     # Definición de columnas y Dropdown de acciones
│   │   ├── [modulo]-filters-action.tsx     # Filtros para la tabla
│   │   ├── [modulo]-cell-actions.tsx       # Acciones de la tabla (editar, eliminar, etc)
│   └── [modulo]-form.tsx                   # Formulario de creacion y edicion
│   └── [modulo]-modal.tsx                  # Dialog modal para mostrar el formulario
│   └── [modulo]-header.tsx                 # encabezado con filtros y acciones de la tabla
│   └── [modulo]-list.tsx                   # listado de datos usando data-table-shadcn-ui
├── hooks/
│   ├── use-[modulo]-filters.ts  # Sync URL params
│   ├── use-[modulo]-queries.ts  # useQuery con tipos anotados
│   └── use-[modulo]-mutations.ts # useMutation con toasts e invalidación global
│ │ ├── keys/ # Query keys locales (se exportan al global)
│ │ ├── loaders/ # clientLoader y clientAction
│ │ ├── pages/ # Páginas (componentes usados en routes)
│ │ ├── services/ # Llamadas API con validación Zod
│ │ ├── store/ # Zustand stores (UI local, modales)
│ │ └── schemas/ # Esquemas de validación Zod
```

## 1. Estructura de Navegación y Rutas

El proyecto utiliza **React Router v7** con una arquitectura de rutas centralizada en `routes.ts` (o `app/routes.ts`).

### 1.1. Jerarquía de Layouts

- **Root Layout (`/`):** Maneja el contexto global, temas y fuentes.
- **Auth Layout (`/login`):** Páginas públicas sin Sidebar.
- **Dashboard Layout (`/dashboard`):** Layout principal que contiene el `AppSidebar`, `NavUser` y el área de contenido (`<Outlet/>`).
- **Module Layouts:** Layouts intermedios (pasarelas) para agrupar rutas por lógica de negocio (ej. Contabilidad, Caja de Ahorro).

### 1.2. Convención de URLs

Las rutas deben seguir una estructura modular para facilitar la lectura y el filtrado de permisos:

- `dashboard/contabilidad/*`
- `dashboard/caja-ahorro/*`
- `dashboard/configuracion/*`

---

## 2. Gestión de Estado en la URL (`nuqs`)

Para mantener la sincronización entre los filtros de la interfaz y lo que el usuario ve/comparte, el estado **no se guarda en `useState`**, sino en la URL.

- **Paginación:** Uso de `parseAsInteger` para `page` y `limit`.
- **Búsqueda:** Uso de `parseAsString` con `shallow: false` para disparar peticiones al servidor.
- **Filtros:** Cada filtro del `DataTable` debe estar mapeado a un parámetro de búsqueda en la URL.

### ✅ Ejemplo de hook de filtros con nuqs

````ts
// features/asociados/hooks/use-asociados-filters.ts
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';

export function useAsociadosFilters() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
  const [limit] = useQueryState('limit', parseAsInteger.withDefault(10));

  return {
    filters: { page, search, limit },
    setPage,
    setSearch,
  };
}

Reglas:

- No se usa useState para filtros que afectan datos del servidor.
- shallow: false por defecto (para disparar carga de datos en TanStack Query).
- Los parámetros se definen en snake_case (page, search, status, etc.).

---

## 3. Patrones de Componentes UI

### 3.1. Sidebar Dinámico (`AppSidebar`)

El Sidebar se construye a partir de una constante `navGroups` definida en `constants/navegations.ts`.

- **Interface:** Los ítems deben seguir el tipo `NavItem` (con `label`, `href`, `icon`, y opcionalmente `items` para desplegables).[cite: 1]
- **Permisos:** Cada ítem debe ser filtrado mediante la función `hasPermission(resource, action)` antes de renderizarse.
- **Colapsibles:** Los menús con hijos deben usar el componente `Collapsible` de shadcn para mantener la jerarquía visual.

### 3.2. DataTables (TanStack Table)

Las tablas deben ser componentes robustos que soporten:

- **Manual Pagination:** El componente `DataTable` recibe `totalItems` y `data` desde el servidor.
- **Empty States:** Si no hay datos (`data.length === 0`), se **debe** mostrar obligatoriamente una fila con el mensaje "No se encontraron resultados" centrado.
- **Sticky Headers:** El encabezado de la tabla debe permanecer visible durante el scroll.

### 3.3 Estado Local de UI / Modales → Zustand
Zustand se usa exclusivamente para:
- Estado de modales (abierto/cerrado, modo create/edit/view, datos temporales).
- Preferencias de UI (columnas visibles en tablas, sidebar colapsado, etc.).

// features/asociados/store/modal-store.ts
import { create } from 'zustand';

type ModalMode = 'create' | 'edit' | 'view';

interface ModalState {
  isOpen: boolean;
  mode: ModalMode;
  data?: any;
  openModal: (mode: ModalMode, data?: any) => void;
  closeModal: () => void;
}

export const useAsociadoModalStore = create<ModalState>((set) => ({
  isOpen: false,
  mode: 'create',
  data: undefined,
  openModal: (mode, data) => set({ isOpen: true, mode, data }),
  closeModal: () => set({ isOpen: false, mode: 'create', data: undefined }),
}));

No se guardan en Zustand los filtros ni la paginación (eso es para nuqs).

### 3.4. Query Keys Centralizadas (globales + locales)

- Local: Cada feature define sus keys en features/[modulo]/keys/index.ts.
- Global: Se registran en /app/lib/query-keys.ts para permitir invalidación entre módulos.

✅ keys locales
// features/asociados/keys/index.ts
export const asociadosKeys = {
  all: ['asociados'] as const,
  lists: () => [...asociadosKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...asociadosKeys.lists(), filters] as const,
  details: () => [...asociadosKeys.all, 'detail'] as const,
  detail: (id: string) => [...asociadosKeys.details(), id] as const,
};

✅ registro global
// app/lib/query-keys.ts
import { asociadosKeys } from '~/features/asociados/keys';
// import otros keys

export const globalQueryKeys = {
  asociados: asociadosKeys,
  // otros módulos...
};

Uso en mutaciones:
import { globalQueryKeys } from '~/lib/query-keys';
queryClient.invalidateQueries({ queryKey: globalQueryKeys.asociados.lists() });


### 3.4. React Router v7: clientLoader y clientAction (obligatorio por feature)

Cada feature que necesite cargar o modificar datos debe implementar clientLoader y clientAction en la carpeta loaders/.

✅ clientLoader típico (precarga con TanStack Query)
// features/asociados/loaders/asociados-loader.ts
import { QueryClient } from '@tanstack/react-query';
import { asociadosKeys } from '../keys';
import { fetchAsociados } from '../services/asociados-api';

export const createAsociadosLoader = (queryClient: QueryClient) => async () => {
  await queryClient.ensureQueryData({
    queryKey: asociadosKeys.list({ page: 1, search: '' }),
    queryFn: () => fetchAsociados({ page: 1, search: '' }),
  });
  return null;
};

✅ clientAction (mutación + invalidación)
// features/asociados/loaders/asociados-action.ts
import { QueryClient } from '@tanstack/react-query';
import { createAsociado } from '../services/asociados-api';
import { globalQueryKeys } from '~/lib/query-keys';
import { redirect } from 'react-router';

export const createAsociadoAction = (queryClient: QueryClient) => async ({ request }) => {
  const formData = await request.formData();
  const nuevo = Object.fromEntries(formData);
  await createAsociado(nuevo);
  await queryClient.invalidateQueries({ queryKey: globalQueryKeys.asociados.lists() });
  return redirect('/dashboard/asociados');
};

### 3.5. Servicios con Zod (obligatorio)

Toda llamada a la API debe tener validación con Zod y tipos inferidos.

✅ ejemplo
// features/asociados/schemas/asociado.schema.ts
import { z } from 'zod';
export const asociadoSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1),
  email: z.string().email(),
});
export type Asociado = z.infer<typeof asociadoSchema>;

// features/asociados/services/asociados-api.ts
import { tenantSchema, type TenantsPaginatedResponse } from '../schemas/tenants.schema';

 getAll: async (params: TenantsQueryParams): Promise<TenantsPaginatedResponse> => {
    const response = await apiClient.get(
      `/core/tenants?${buildQueryParams(params)}`,
    );

    try {
      const parsed = tenantsListResponseSchema.parse(response.data);
      return parsed;
    } catch {
      const data = tenantSchema.array().parse(response.data);
      return {
        data,
        meta: {
          totalItems: data.length,
          itemCount: data.length,
          itemsPerPage: params.limit ?? 10,
          totalPages: Math.ceil(data.length / (params.limit ?? 10)),
          currentPage: params.page ?? 1,
        },
      };
    }
  },


### 3.6. Carpeta pages en cada feature (obligatorio)
Cada feature tiene una subcarpeta pages/ que contiene los componentes de página (vista completa). Estos componentes no se definen directamente en routes/; las rutas solo importan desde aquí.

✅ ejemplo de página

import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/shadcn/select';
import { DataTable } from '@repo/shadcn/table/data-table';
import { DataTableSkeleton } from '@repo/shadcn/table/data-table-skeleton';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTenantsFilters } from '../hooks/use-tenants-filters';
import {
  useTenantActiveCountQuery,
  useTenantsQuery,
} from '../hooks/use-tenants-queries';
import { tenantsColumns } from './tables/tenants-columns';
import { TenantsHeader } from './tenants-header';
import { TenantsModal } from './tenants-modal';

export default function TenantsList() {
  const { filters, setFilters, clearFilters } = useTenantsFilters();
  const { data, isLoading } = useTenantsQuery(filters);
  const { data: count } = useTenantActiveCountQuery();
  const [openModal, setOpenModal] = useState(false);

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={filters.limit} />;
  }

  const tenantsData = data?.data || [];

  return (
    <div className="space-y-4">
      <TenantsHeader />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar tenants..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            className="w-full sm:w-[250px]"
          />
          <Select
            value={filters.isActive}
            onValueChange={(value) =>
              setFilters({
                isActive: value as 'all' | 'true' | 'false',
                page: 1,
              })
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Activos</SelectItem>
              <SelectItem value="false">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setOpenModal(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Tenant
        </Button>
      </div>

      <DataTable
        columns={tenantsColumns}
        data={tenantsData}
        totalItems={data?.meta?.totalItems || 0}
        pageSizeOptions={[10, 20, 30, 50]}
      />

      <TenantsModal
        open={openModal}
        onOpenChange={setOpenModal}
        mode="create"
      />
    </div>
  );
}

// routes/dashboard/asociados.tsx
import { TenantsPage } from '~/features/asociados/pages/AsociadosListPage';
import { createAsociadosLoader } from '~/features/asociados/loaders/asociados-loader';
import { createAsociadoAction } from '~/features/asociados/loaders/asociados-action';
import { queryClient } from '~/lib/query-client';

export const clientLoader = createAsociadosLoader(queryClient);
export const clientAction = createAsociadoAction(queryClient);
export default TenantsPage;
---

## 4. Estándares de Código para la IA

### 4.1. Tipado Estricto (TypeScript)

- **Interfaces:** Definir interfaces claras para los DTOs que vienen de la API.
- **Props:** Todos los componentes compartidos (UI) deben extender sus props nativas (ej. `React.ComponentProps<typeof Sidebar>`).
- **No Anys:** Está prohibido el uso de `any`. Si un tipo es desconocido, usar `unknown` y estrechar el tipo (type narrowing).[cite: 1]

### 4.2. Decisiones de Diseño UI

- **Iconografía:** Uso exclusivo de `lucide-react`.
- **Feedback:** Uso de `Sonner` o `Toast` para confirmaciones de acciones (Crear, Editar, Eliminar).
- **Responsive:** Priorizar `flex-col` en móviles y `flex-row` en desktop para el footer de las tablas y formularios.

---

## 5. Ejemplo de Configuración de Ruta Modular

Para agregar un nuevo grupo de rutas, el agente debe seguir este patrón en `routes.ts`:

```typescript
route('dashboard/contabilidad', 'layouts/module-layout.tsx', [
  index('routes/dashboard/accounting/index.tsx'),
  route('cuentas', 'routes/dashboard/accounting/accounts.tsx'),
  route('asientos', 'routes/dashboard/accounting/entries.tsx'),
]),
````

---

## 6. Sincronización con Backend

- **Tenant Context:** El frontend no envía el `tenantId` en el cuerpo (body) de las peticiones de creación (a menos que seas Superadmin). El `tenantId` se deduce en el backend por el token de sesión o el header `x-tenant-id`.
- **Superadmin:** Cuando el usuario es Superadmin, el frontend debe habilitar un selector de Tenant global que setee el header correspondiente para filtrar los datos de la organización seleccionada.

---

> **Nota para la IA:** Mantén siempre la coherencia con el archivo `navegations.ts` al añadir nuevas rutas para que aparezcan automáticamente en el Sidebar con sus iconos y permisos respectivos.

## Module-Builder-Advanced (RRv7 + Shadcn Modals + TanStack)

## 1. Objetivo

Construir módulos completos desde cero siguiendo el patrón modular del proyecto. Este skill garantiza que cada nueva entidad tenga una gestión de datos robusta, una tabla interactiva y un flujo de trabajo basado en modales para CRUD (Crear, Leer, Actualizar, Borrar).

## 2. Flujo de UI Estándar (Obligatorio)

### A. Acciones en Tabla (`columns.tsx`)

Cada fila debe incluir una columna de acciones con un `DropdownMenu` que contenga:

1.  **Ver Detalles:** Abre un Modal en modo **solo lectura**.
2.  **Editar:** Abre el mismo Modal en modo **edición**.
3.  **Eliminar:** Dispara un **Modal de Confirmación** antes de ejecutar la mutación.

### B. Creación

- El botón "Nuevo [Entidad]" se ubica en la fila de filtros (`table-filters.tsx`).
- Modal polivalente: Un mismo modal para crear, editar y ver, controlado por el store de Zustand.

### C. Feedback y Confirmaciones

- Todas las operaciones (`POST`, `PUT`, `DELETE`) deben mostrar un **Toast** (éxito o error).
- Las acciones destructivas (Eliminar) y las de guardado (Crear/Editar) requieren AlertDialog un paso de **Confirmación** previo.

## 4. Patrones de Código Específicos

### A. Hook de Mutaciones con Feedback (Toast)

```typescript
export function useCreateMutation(): UseMutationResult<
  TData,
  TError,
  TVariables
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.create,
    onSuccess: () => {
      toast({ title: 'Éxito', description: 'Registro creado correctamente' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.modulo.all });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

### B. Gestión de Estado del Modal (Zustand o Local)

Se recomienda un estado que controle qué acción se está realizando para reutilizar el formulario:

```typescript
type ModalState = {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  data?: Entity;
};
```

## 5. Instrucciones para el Agente

Al generar el nuevo módulo:

1.  **Define el Esquema:** Crea el `zodSchema` para la entidad.
2.  **Crea los Componentes de Tabla:** Implementa el `DataTable` y las `columns` con el menú de acciones.
3.  **Implementa el Modal Polivalente:** Crea un componente de formulario que cambie a `disabled` si el modo es `view`.
4.  **Añade Diálogos de Confirmación:** Usa el componente `AlertDialog` de Shadcn para la eliminación, creacion y edicion.
5.  **Notificaciones:** Asegura que cada hook en `use-mutations.ts` implemente el hook `useToast`.
6.  **Sincronización:** Escribir loaders/ con clientLoader y clientAction..
7.  Implementar servicios API en services/.
8.  Crear query keys locales y registrarlos en lib/query-keys.ts
9.  Crear hooks de filtros con nuqs en hooks/use-filters.ts
10. Crear hooks de queries y mutations en hooks/.
11. Crear store de Zustand para el modal en store/
12. Desarrollar la página en pages/ (usa los hooks y componentes).
13. Enlazar la ruta en routes/dashboard/[modulo]/nuevo-modulo.tsx importando la página y los loaders.

## 6. Gotchas y Prevención de Errores Comunes

Para garantizar una refactorización y creación de módulos sin errores, aplica obligatoriamente estas reglas derivadas de la experiencia práctica:

### A. Filtros con `nuqs` y Loaders de React Router
1. **Debounce Obligatorio en Búsquedas:** Cuando uses un `<Input>` para texto de búsqueda ligado a un filtro `nuqs`, **nunca** actualices el estado de `nuqs` directamente en el `onChange` (esto causa pérdida de foco al re-renderizar). Debes usar un estado local (`useState`) para el input y un `useEffect` con un `setTimeout` (debounce, ej. 400ms) para sincronizar el estado local con la URL.
2. **Esquema Zod Dual:** Aunque `nuqs` tiene sus propios parsers (`parseAsInteger`, etc.), **debes mantener exportado un esquema Zod** (ej. `[modulo]FilterSchema`) en el hook de filtros. Este esquema es indispensable para que los `loaders` de React Router puedan parsear los `searchParams` del lado del servidor de forma segura.

### B. Tipado y Sanitización (Evitar Type Mismatches)
3. **Manejo de `null` vs `undefined` en Formularios:** Las respuestas de la API (`schemas`) suelen retornar campos opcionales como `string | null`, pero los esquemas de mutación (`[modulo]Mutation`) esperan `string | undefined` (sin `null`). Al cargar datos en el `defaultValues` del formulario, debes usar una función sanitizadora (ej. `toFormValues`) que convierta todos los valores `null` a `undefined`, y **castear explícitamente el resultado a `Partial<MutationType>`** para que TypeScript lo acepte sin errores de compatibilidad de propiedades.
4. **Tipos Retornados en Hooks Ingeridos:** Si un hook como `useQuery` infiere su tipo de retorno desde un método del servicio (ej. `service.getAll()`), el tipo/interfaz utilizado por el servicio (ej. `[Modulo]PaginatedResponse`) **debe estar explícitamente exportado** desde el archivo del servicio. Si no se exporta, TypeScript arrojará el error *"el tipo de valor devuelto... usa el nombre... pero no se puede nombrar"*.

### C. Query Keys
5. **Tipado de Filtros en Query Keys:** En el archivo `[modulo]-keys.ts`, al definir la key para `list(filters)`, el parámetro de filtros **no debe tiparse como `Record<string, unknown>`**. Las `interfaces` de TypeScript no tienen *index signatures* implícitas y fallarán al pasarse. Usa el tipo `object` (o un genérico/tipo explícito) para que permita pasar la interfaz de los filtros sin errores.

---

**Nota final:** Todos los archivos deben ser TypeScript estricto, sin `any`. Los componentes de UI deben usar `lucide-react` para iconos y `shadcn/ui` para componentes base.

---

**Input de usuario:** "Crea el módulo [Nombre] con los campos [campo1, campo2...]"
