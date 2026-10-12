# 05 · Plan de Fase 1 — API (`portal-api`)

> Alcance de la Fase 1: **todo lo del backend/API**. El frontend (`apps/portal` con Astro) es Fase 5.
> Estado: plan listo para ejecutar. Requiere cerrar la **decisión de esquema compartido** (§1).

## 0. Estado de ejecución

**Decisiones cerradas:**
- Estrategia de esquema: **Opción A** (subconjunto propio en `portal-api`, sin tocar `apps/api`).
- Arranque: PR1–PR3.

**Completado:**

| PR | Estado | Evidencia |
|---|---|---|
| PR1 · `packages/contracts` | ✅ | `pnpm --filter @repo/contracts build` OK (dist generado); lint OK |
| PR2 · Esquema `portal` + migración | ✅ | `db:generate` → `0000_strange_queen_noir.sql` (CREATE SCHEMA + 4 enums + 6 tablas + índices); FK+grants en `0001_portal_fks_and_grants.sql` |
| PR3 · Scaffold `apps/portal-api` | ✅ | `nest build` OK (TSC 0 issues, SWC 23 files); `GET /api/portal/health` → 200; Swagger en `/portal-docs` |
| PR4 · Auth portal | ✅ | `login`/`refresh`/`logout`/`logout-all`/`change-password` + `PortalJwtStrategy` + `PortalAuthGuard`; `/health` 200 (público) y `/auth/logout` sin token → 401; build OK |
| PR5 · OTP + Resend | ✅ | `OtpService` + `ResendService`; `/auth/forgot-password`, `/auth/reset-password` (públicos), `/otp/request`, `/otp/verify` (protegidos); `/otp/request` sin token → 401; build OK (39 files) |
| PR6 · Consultas `/me/*` | ✅ | 11 endpoints (statement, haberes, retiros, prestamos, creditos, historial, movimientos, excesos + detalles) con scoping por token y validación de pertenencia; `/me/statement` sin token → 401; build OK (46 files) |
| PR7 · Perfil | ✅ | `GET/PATCH /me/profile` (allowlist phone/email/localityId/address; OTP obligatorio en email/teléfono); escritura en `savings.associates` + upsert `portal.associate_profile` |
| PR8 · Catálogos | ✅ | `/catalog/states`, `/municipalities`, `/parishes`, `/localities/resolve`; build OK (54 files) |
| PR9 · Aprovisionamiento | ✅ | `provisionAssociates` (idempotente, opción `limit`) + `ProvisioningService` + CLI `sync:associates`; **probado E2E contra la BD real** (login `cédula/cédula` + `/me/statement` + `/me/haberes` + `/catalog/states`) |
| PR10 · Hardening | ✅ | Helmet, throttling por endpoint (login/otp/forgot/reset), `trust proxy`, test unitario de `SecurityService`; tracking de migraciones aislado (`drizzle.__portal_migrations`) |

**Fase 1 (API) COMPLETA.** Siguiente: Fase 5 (frontend `apps/portal` con Astro).

**Notas de implementación aplicadas:**
- `portal-api` define su propio subconjunto de tablas ERP (`src/database/schema/tables/erp.ts`) **sin** `.references()` y **sin** pasar por drizzle-kit, para que la generación solo cree el esquema `portal`.
- Las FKs hacia `tenant.tenants`, `savings.associates` y `core.localities`, y los `GRANT` del rol `portal_app`, viven en la migración **custom** `0001`.
- El entry de generación es `src/database/schema/portal.ts` (drizzle-kit registra solo lo **exportado**).
- El rol `portal_app` lo crea el **DBA** (con `LOGIN`/contraseña); los `GRANT` se aplican si el rol existe.
- Autenticación: realm propio con `aud`/`iss = zonastart-portal`, secretos dedicados **fail-closed**, cookie `portal_session` (httpOnly) con refresh rotado y detección de reuso; lockout tras N intentos (`PORTAL_MAX_LOGIN_ATTEMPTS`, `PORTAL_LOCK_MINUTES`).

## Objetivo

Entregar `apps/portal-api` (NestJS 11) operativo con:

1. Identidad del asociado (realm propio, `usuario = cédula`, `contraseña = cédula`, sin cambio forzado).
2. OTP por correo (**Resend**) para verificación de email/teléfono y recuperación.
3. Consultas de solo lectura acotadas al token (paridad con el área `inquiry`).
4. Edición de perfil acotada (teléfono, email, dirección, localidad).
5. Catálogos de localidad (estado → municipio → parroquia → `localityId`).
6. Todo el acceso a datos con **Drizzle ORM**.

## 1. Decisión previa: estrategia de esquema compartido ⚠️

El ERP referencia `@/database/schema` en **200+ ubicaciones**. Opciones:

| Opción | Descripción | Pro | Contra |
|---|---|---|---|
| **A · Subconjunto propio en `portal-api`** | Declarar en `portal-api` solo las tablas de lectura que usa (mismos nombres físicos) + tablas `portal` | **Cero cambios en el ERP**; bajo riesgo; rápido | Duplicación del subconjunto; riesgo de drift si el ERP renombra columnas |
| **B · `packages/database` (fuente única)** | Mover el esquema a un paquete y re-exportar desde el ERP | Fuente única; sin drift | Refactor grande de 200+ imports; **riesgo alto** sobre el ERP sin pruebas |
| **C · Alias TS a la ubicación del ERP** | `portal-api` importa `../../api/src/database/schema` vía `paths` | Sin duplicar; sin tocar el ERP | Acopla `portal-api` al *source* de `apps/api`; frágil para build/deploy |

**Recomendación:** **A** para la Fase 1 (avanzar sin riesgo), dejando **B** como tarea de consolidación posterior (con suite de pruebas del ERP como red de seguridad). Es reversible: pasar de A a B no reescribe lógica, solo `imports`.

## 2. PRs de la Fase 1

Dependencias: `PR1 → PR2 → PR3 → (PR4, PR8) → (PR5, PR6, PR7) → PR9 → PR10`.

| PR | Alcance | Depende de | Criterios de aceptación |
|---|---|---|---|
| **PR1** | `packages/contracts`: esquemas zod (request/response) compartidos | — | `pnpm build` verde; exporta tipos |
| **PR2** | Esquema `portal` (Drizzle) + migración + grants custom | PR1 (decisión §1) | `db:generate`/`db:migrate` OK; `portal_app` con mínimos privilegios |
| **PR3** | Scaffold `apps/portal-api`: config/env, `DrizzleProvider` propio, logging, health, Swagger | PR2 | App arranca; `/health` y `/api` responden; pool con timeouts |
| **PR4** | PortalAuth: `accounts`, login cédula/cédula, sessions, refresh rotado, logout(all), change-password, `PortalMemberGuard` | PR3 | Login OK; guard deriva `associateId` del token; sin fallback de secreto |
| **PR5** | OTP + Resend: `otp_codes`, `email_log`, `otp/request`, `otp/verify`, `forgot/reset` | PR4 | Código por email; TTL/uso único/intentos; respuesta genérica |
| **PR6** | Consulta read-only `/me/*` (statement, haberes, retiros, prestamos, creditos, historial, movimientos, excesos, detalles) | PR3, PR4 | Paridad con `inquiry`; **scoping** por token; tests IDOR |
| **PR7** | Perfil `GET/PATCH /me/profile` (allowlist) + `associate_profile.address` + OTP en email/phone | PR5 | Solo allowlist; OTP en email/phone; auditoría |
| **PR8** | Catálogos `/catalog/*` (states, municipalities, parishes, resolve locality) | PR3 | Cascada y resolución de `localityId` |
| **PR9** | Aprovisionamiento: evento `associate.created` + listener idempotente + backfill | PR4, PR2 | Alta automática; upsert idempotente; backfill ejecutable |
| **PR10** | Hardening + tests: throttle, helmet, auditoría, Swagger final, pruebas de seguridad | PR6–PR9 | Checklist del threat model cubierto; CI verde |

## 3. Estructura de `apps/portal-api`

```
apps/portal-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── bootstrap.ts
│   ├── common/
│   │   ├── config/{envs.ts,config.module.ts}
│   │   ├── decorators/{public.decorator.ts,portal-member.decorator.ts}
│   │   ├── guards/{portal-member.guard.ts,portal-throttler.guard.ts}
│   │   ├── interceptors/req-log.interceptor.ts
│   │   └── modules/{logger.module.ts,throttle.module.ts}
│   ├── database/{drizzle-provider.ts,drizzle.module.ts,schema/…}
│   ├── features/
│   │   ├── auth/{auth.controller.ts,auth.service.ts,auth.module.ts,strategies,jwt}
│   │   ├── otp/{otp.service.ts,resend.service.ts}
│   │   ├── member/{statement.controller.ts,…}   # /me/*
│   │   ├── profile/{profile.controller.ts,profile.service.ts}
│   │   └── catalog/{catalog.controller.ts,catalog.service.ts}
│   └── shared/…
├── test/
├── nest-cli.json
├── tsconfig.json
└── package.json
```

## 4. Convenciones de implementación

- **Drizzle para todo el CRUD**; sin SQL crudo de datos (solo la migración custom de `GRANT`s).
- `PortalMemberGuard` inyecta `{ associateId, tenantId, accountId }` desde el JWT; **ningún** endpoint `/me/*` acepta cédula/associateId por parámetro.
- Pool propio (`PORTAL_DATABASE_URL`, rol `portal_app`, timeouts).
- Secretos dedicados: `PORTAL_JWT_SECRET`, `PORTAL_JWT_REFRESH_SECRET`, `RESEND_API_KEY`.
- Validación con `nestjs-zod` (patrón del ERP).
- Auditoría en `portal.access_log` (o `audit.*`).
- OpenAPI según [`02-api-openapi.yaml`](./02-api-openapi.yaml).

## 5. Variables de entorno (borrador)

```env
NODE_ENV=development
PORT=3001
HOST=localhost
ALLOW_CORS_URL=http://localhost:4321
PLATFORM_DOMAIN=zonastart.local

PORTAL_DATABASE_URL="postgres://portal_app:****@host:5432/db?options=-c%20search_path=portal,savings,core,tenant,public"
PORTAL_JWT_SECRET=            # >=32 chars
PORTAL_JWT_REFRESH_SECRET=    # >=32 chars

RESEND_API_KEY=re_****
RESEND_FROM="Portal <no-reply@dominio-verificado>"
OTP_TTL_SECONDS=600
OTP_MAX_ATTEMPTS=5
```

## 6. Definición de "hecho" (DoD) de la Fase 1

- [ ] `apps/portal-api` compila y arranca con `pnpm --filter portal-api dev`.
- [ ] Migración `portal` aplicada; rol `portal_app` con grants y timeouts.
- [ ] Login cédula/cédula, refresh rotado, logout, change-password (opcional) y guard funcionando.
- [ ] OTP por Resend operativo (con `email_log`).
- [ ] Endpoints `/me/*` con paridad de `inquiry`, scoping verificado y **tests IDOR** en verde.
- [ ] Perfil editable (allowlist) con OTP en email/phone.
- [ ] Catálogos y resolución de localidad.
- [ ] Aprovisionamiento automático + backfill.
- [ ] Swagger publicado; checklist de seguridad del threat model cubierto.
