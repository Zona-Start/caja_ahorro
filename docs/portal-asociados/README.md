# Portal del Asociado — Documentación de diseño (Fase 0)

> **Estado:** DISEÑO / PLANEACIÓN. No hay código de aplicación implementado.
> Esta carpeta contiene los artefactos de diseño aprobados antes de iniciar la Fase 1.

## Propósito

Crear un **portal de autoservicio para los asociados** de la caja de ahorro que exponga la
información que hoy vive en el área de back-office `inquiry` del ERP, con **acceso de solo
consulta** salvo un conjunto acotado de datos personales editables.

El portal es un **sistema nuevo** dentro del monorepo:

| App / Paquete | Rol | Estado |
|---|---|---|
| `apps/portal-api` | API NestJS 11 del portal (realm de identidad propio) | por crear |
| `apps/portal` | Frontend Astro 7 (SSR) + React islands | por crear |
| `packages/database` | Esquema Drizzle + migraciones (fuente única) | por crear |
| `packages/contracts` | Contratos zod compartidos (portal ↔ portal-api) | por crear |
| `portal` (esquema PostgreSQL) | Datos propios del portal | diseñado aquí |

## Decisiones cerradas

1. **Identidad — realm separado vinculado.** `portal.accounts` (1:1 con `savings.associates`) +
   `portal.sessions`, firmas JWT propias (`aud: zonastart-portal`) y secretos dedicados.
   Un asociado **no** es un `auth.users` ni tiene roles de staff.
2. **Aprovisionamiento automático.** Se crea la cuenta en la **carga mensual de asociados/haberes**.
   `usuario = cédula`, `contraseña inicial = cédula`, **sin cambio forzado**.
3. **Seguridad de acceso.** Área de Seguridad con cambio de contraseña **opcional**.
   Se mantienen: rate limit por IP/cuenta, lockout, CAPTCHA tras umbral, auditoría y
   notificación de alta. La contraseña nueva no puede ser igual a la cédula.
4. **Datos editables por el asociado:** teléfono, email, dirección y localidad
   (estado → municipio → parroquia → `localityId`).
5. **Base de datos.** Misma instancia PostgreSQL, **esquema `portal` nuevo**, y rol
   `portal_app` de **mínimo privilegio** (SELECT en tablas de lectura, UPDATE por columnas
   permitidas en `savings.associates`, CRUD total solo en `portal`).
6. **Contención con procesos pesados del ERP (cierre).** Pool de conexiones separado,
   `statement_timeout`, transacciones READ ONLY, índices y paginación; réplica de lectura y
   read-model como fase de escalado.
7. **OTP por correo electrónico** usando **Resend**.
8. **Acceso a datos con Drizzle ORM.** `portal-api` usa Drizzle para **todo** el CRUD
   (consultar, crear, actualizar y eliminar), con el mismo patrón del ERP
   (`DRIZZLE_PROVIDER` + `NodePgDatabase<typeof schema>`) y **pool/conexión propios** con el rol
   `portal_app`. El SQL crudo se reserva **únicamente** para los `GRANT` del rol (migración custom).
   Ver [`04-esquema-drizzle.md`](./04-esquema-drizzle.md#7-capa-de-acceso-a-datos-portal-api--drizzle-orm).

## Índice de documentos

| Documento | Contenido |
|---|---|
| [`01-modelo-datos.md`](./01-modelo-datos.md) | ERD, modelo de localidad, reglas de datos y aprovisionamiento |
| [`04-esquema-drizzle.md`](./04-esquema-drizzle.md) | Flujo de esquema y migraciones con **Drizzle ORM** |
| [`drizzle/portal.schema.reference.ts`](./drizzle/portal.schema.reference.ts) | Esquema Drizzle de referencia (tablas + relaciones) |
| [`ddl/portal-schema.sql`](./ddl/portal-schema.sql) | DDL SQL de **referencia** (lo que genera `drizzle-kit`) |
| [`ddl/portal-role-grants.sql`](./ddl/portal-role-grants.sql) | Matriz de permisos del rol `portal_app` (migración custom) |
| [`ddl/portal-role-create.sql`](./ddl/portal-role-create.sql) | Creación del rol `portal_app` (paso del DBA) |
| [`02-api-openapi.yaml`](./02-api-openapi.yaml) | Especificación OpenAPI 3.1 de `portal-api` |
| [`03-threat-model.md`](./03-threat-model.md) | Threat model (STRIDE) + controles + Resend |
| [`05-plan-fase-1-api.md`](./05-plan-fase-1-api.md) | **Plan de la Fase 1 (API)** por PRs, con dependencias y DoD |
| [`06-frontend-astro.md`](./06-frontend-astro.md) | **Fase 5 · Frontend `apps/portal`** (Astro 7 + React, mantenimiento, login, dashboard) |
| [`07-despliegue.md`](./07-despliegue.md) | **Despliegue** (build, BD, arranque, reverse proxy, checklist) |

## Implementación (Fase 1 · API)

- `apps/portal-api` — API del portal (scaffold PR1–PR3 completado).
- `packages/contracts` — contratos zod compartidos.
- Migraciones: `apps/portal-api/src/database/migrations/`.
- Estado detallado: [`05-plan-fase-1-api.md`](./05-plan-fase-1-api.md#0-estado-de-ejecución).

## Referencias del código base del ERP (as-is)

- Auth interno: `apps/api/src/features/auth/`
- Guards globales: `apps/api/src/common/guards/`
- Esquema: `apps/api/src/database/schema/tables/` (`auth.ts`, `savings.ts`, `core.ts`, `tenants.ts`)
- Inquiry back-office: `apps/api/src/features/savings/parnerts/associates/associate-inquiry.*`
  y `apps/web/app/features/savings/partners/inquiry/`
- Multi-tenant por host: `apps/api/src/features/core/tenants/tenant-public.controller.ts`,
  `apps/web/app/lib/host-resolver.ts`
