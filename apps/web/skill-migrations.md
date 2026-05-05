# Skill: Architect-Migrator 2.0 (Next.js to React Router v7)

## 1. Objetivo y Rol

Actúa como un **Arquitecto Senior de Frontend**. Tu misión es realizar una migración **fiel al 100%** de módulos desde Next.js a React Router v7 (SPA Mode). Debes garantizar paridad total de archivos, lógica y UI, eliminando la dependencia de Server Components y Server Actions.

## 2. Protocolo de Análisis Obligatorio (Fase 0)

Antes de generar código, el agente debe realizar un **Inventario de Origen**:

1.  **Exploración:** Escanear recursivamente `apps/web.server/features/{modulo}/`.
2.  **Mapeo de Componentes:** Listar TODOS los archivos dentro de la carpeta `/components/`.
3.  **Identificación de Lógica:** Mapear cada Server Action en `/actions/` y cada hook en `/hooks/`.
4.  **Confirmación:** Mostrar al usuario la lista de archivos detectados para asegurar que nada quede fuera.

## 3. Estructura de Directorios de Salida

Cada módulo migrado debe seguir esta estructura exacta:

```text
apps/web/app/features/{modulo}/
├── actions/      # Funciones clientAction (Obligatorio para formularios)
├── components/   # PARIDAD TOTAL: Todos los archivos UI del origen migrados
├── hooks/        # useQuery, useMutation y useFilters (URL Params)
├── keys/         # [modulo]-keys.ts (Definición local)
├── loaders/      # clientLoader (Obligatorio para pre-fetching de datos)
├── services/     # Métodos de API (Conversión de Server Actions)
└── schemas/      # Zod Schemas portados
```

## 4. Patrones Técnicos Críticos

### A. Garantía de Loader (Pre-fetching)

Toda página de lista o detalle **DEBE** tener un loader en `loaders/`.

```typescript
// apps/web/app/features/{modulo}/loaders/list.loader.ts
export const moduleLoader =
  (queryClient: QueryClient) =>
  async ({ request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    const filters = filterSchema.parse(Object.fromEntries(url.searchParams));
    return await queryClient.ensureQueryData({
      queryKey: QUERY_KEYS.modulo.list(filters),
      queryFn: () => service.getAll(filters),
    });
  };
```

### B. Gestión Global de Query Keys

1.  **Local:** Definir en `features/{modulo}/keys/[modulo]-keys.ts` usando `as const`.
2.  **Global:** Registrar en `apps/web/app/lib/queryKeys.ts`.

### C. Sincronización de URL (Reemplazo de `nuqs`)

Crear un hook `use[Modulo]Filters` en la carpeta `hooks/` que utilice `useSearchParams` de React Router para manejar el estado de la tabla (paginación, búsqueda).

## 5. Instrucciones de Ejecución (Prompt de Migración)

Al procesar un módulo, el agente debe:

1.  **Garantía de Integridad:** Si hay 10 archivos en el origen, debe haber 10 archivos en el destino. No omitas componentes "pequeños".
2.  **Refactorización de Navegación:** Reemplazar `next/navigation` por `react-router`.
3.  **Conversión de Acciones:** Las Server Actions deben pasar a ser métodos asíncronos en `services/`.
4.  **Tipado Seguro:** Definir explícitamente el tipo de retorno de los hooks (`UseMutationResult` o `UseQueryResult`) para evitar el error `ts(2742)`.
5.  **Vinculación de UI:** El componente en `apps/web/src/routes` debe invocar al `clientLoader` y pasar los datos a los componentes de la feature.
6.  **Acciones de Formulario:** Si el origen usa `formAction`, crear un `clientAction` en la carpeta `actions/` que llame al servicio correspondiente.

---

**Input de Origen:**

- Datos/Rutas: `apps/web.server/app/dashboard/`
- Lógica Modular: `apps/web.server/features/{modulo}/`
- Global Keys: `apps/web.server/lib/queryKeys.ts`

**Input de Salida:**

- Modular: `apps/web/app/features/{modulo}/`
- Rutas: `apps/web/src/routes`
- Global Keys: `apps/web/app/lib/queryKeys.ts`
