# Skill: Module-Builder-Advanced (RRv7 + Shadcn Modals + TanStack)

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
