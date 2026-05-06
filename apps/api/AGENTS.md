Este documento define la **Fuente de Verdad** para la arquitectura del Backend del proyecto **Zona Start**. Establece las reglas de diseño para NestJS y Drizzle ORM, asegurando que cualquier agente de IA o desarrollador mantenga la integridad del modelo **SaaS Multi-tenant**.

---

# ⚙️ Especificación de Infraestructura y Arquitectura: Backend (NestJS + Drizzle)

## 1. Patrón de Arquitectura

El sistema sigue una arquitectura **Modular y Orientada a Características (Feature-Driven)**.

### 1.1. Estructura de un Módulo (Feature)

Cada módulo debe estar autocontenido en `apps/api/src/features/[feature-name]` y contener:

- **`.controller.ts`**: Manejo de rutas, validación de DTOs y respuesta HTTP.
- **`.service.ts`**: Lógica de negocio pura y consultas a base de datos vía Drizzle.
- **`.schema.ts`**: Definición de tablas y relaciones de PostgreSQL.
- **`/dto`**: Carpeta con objetos de validación (`Create...Dto`, `Update...Dto`, `Filter...Dto`).

---

## 2. Multi-tenancy y Aislamiento de Datos

El backend utiliza una estrategia de **Esquema Compartido (Shared Schema)** con aislamiento lógico por `tenant_id`.

### 2.1. Gestión de Contexto (`nestjs-cls`)

Se utiliza `nestjs-cls` para gestionar el estado de la petición de forma asíncrona y segura:

- **Extracción:** El `tenantId` y el `userId` se extraen del token JWT o headers en un interceptor/middleware.
- **Uso en Servicios:** Se debe inyectar el `TenantContextService` para obtener el `targetTenantId` actual.

### 2.2. Reglas de Filtrado

- **Usuarios Estándar:** Todas las consultas `SELECT`, `UPDATE` y `DELETE` **deben** incluir la condición `eq(table.tenantId, currentTenantId)`.
- **Superadmins:** Pueden omitir el filtro de `tenantId` para ver data global o pasar un `tenantId` opcional en el DTO para filtrar una organización específica.

---

## 3. Convenciones de Base de Datos (Drizzle ORM)

### 3.1. Estructura de Tablas y Timestamps

Para mantener la consistencia en el seguimiento de auditoría, todas las tablas deben usar el objeto común `timestamps`:

- **Naming Convention:** Se debe usar obligatoriamente el sufijo **`ById`** para columnas que referencian UUIDs de usuarios.
- **Campos Requeridos:**
  - `createdById`: UUID del creador.
  - `updatedById`: UUID de la última actualización.
  - `createdAt` / `updatedAt`: Timestamps automáticos.
- **Borrados:** Se prefiere el **Soft Delete** con las columnas `deletedAt` y `deletedBy`.

### 3.2. Tipos de Datos

- **IDs:** Siempre usar `uuid` generado por base de datos (`defaultRandom()`).
- **Moneda:** Usar tipos numéricos de alta precisión para balances contables.

---

## 4. Seguridad y Permisos (IAM)

El sistema implementa un control de acceso basado en recursos y acciones (`resource:action`).

- **Resources:** Definidos por módulo (ej: `accounting:cycles`, `savings:members`).
- **Actions:** Operaciones permitidas (`create`, `read`, `update`, `delete`, `approve`).
- **Guardias:** Las rutas en los controladores deben estar protegidas por un `PermissionGuard` que verifique el permiso contra el `UserSummary` del token.

---

## 5. Estandarización de Respuestas y Paginación

### 5.1. findAllByPagination

Todos los servicios que devuelvan listas deben implementar paginación en el servidor:

- **Entrada:** Recibir un UUID (opcional para Superadmin) y un `FilterDto` con `page`, `limit` y `search`.
- **Salida:** Un objeto con la siguiente estructura:
  ```json
  {
    "data": [],
    "meta": {
      "totalItems": 100,
      "itemCount": 10,
      "itemsPerPage": 10,
      "totalPages": 10,
      "currentPage": 1
    }
  }
  ```

---

## 6. Reglas de Oro para el Agente IA

1.  **Validación de UUID:** Antes de realizar una consulta, asegúrate de que el `tenantId` sea un string UUID válido y no el objeto DTO completo.
2.  **Inyección de Dependencias:** Siempre usa el decorador `@Injectable()` y mantén los servicios con el `Scope.REQUEST` si dependen de `TenantContextService`.
3.  **Manejo de Errores:** Usa las excepciones integradas de NestJS (ej: `ConflictException`, `NotFoundException`).
4.  **Lógica Contable:** Al generar _seeds_ o funciones de contabilidad, respeta la jerarquía de cuentas: `100` Activos, `200` Pasivos, `300` Patrimonio, `400` Ingresos, `500` Egresos.

---

_Este documento asegura que el código generado mantenga la escalabilidad necesaria para el crecimiento de Zona Start._

```

```
