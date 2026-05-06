Este documento es la **Guía de Estándares y Arquitectura Frontend** para el proyecto Web de **Zona Start**. Su objetivo es asegurar que cualquier agente de IA o desarrollador mantenga la consistencia en el uso de React Router v7, la gestión de estado en la URL y los patrones de interfaz modular.

---

# 🌐 Especificación de Arquitectura Frontend: Web (React Router v7)

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
```

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
- Abre un Modal con el formulario de creación limpio.

### C. Feedback y Confirmaciones

- Todas las operaciones (`POST`, `PUT`, `DELETE`) deben mostrar un **Toast** (éxito o error).
- Las acciones destructivas (Eliminar) y las de guardado (Crear/Editar) requieren un paso de **Confirmación** previo.

## 3. Estructura de Archivos del Módulo

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
└── ... (keys, services, loaders, schemas)
```

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
6.  **Sincronización:** Asegura que el `clientLoader` en `loaders/` pre-cargue la lista principal.

---

**Input de usuario:** "Crea el módulo [Nombre] con los campos [campo1, campo2...]"
