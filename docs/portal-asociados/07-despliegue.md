# 07 · Despliegue

Guía para poner en producción el **Portal del Asociado** (`apps/portal-api` + `apps/portal`).

## 1. Requisitos

| Componente | Requisito |
|---|---|
| `apps/portal-api` | Node ≥ 20 (NestJS 11) |
| `apps/portal` | **Node ≥ 22.12** (Astro 7) |
| Base de datos | PostgreSQL (misma instancia del ERP) |
| Correo | Cuenta **Resend** con dominio verificado (SPF/DKIM/DMARC) |

> ⚠️ Un mismo host con dos versiones de Node: usa el binario de Node 22 para `portal` y el de
> Node 20 (o ≥22) para `portal-api`. Con PM2 se puede fijar `interpreter` por app.

## 2. Variables de entorno

### `apps/portal-api/.env`
```env
NODE_ENV=production
HOST=0.0.0.0
PORT=3001
ALLOW_CORS_URL=https://portal.zonastart.com
PLATFORM_DOMAIN=zonastart.local

PORTAL_DATABASE_URL="postgresql://portal_app:<secreto>@<host>:5432/<db>?options=-c%20search_path=portal,savings,core,tenant,treasury,inventory,public"
PORTAL_DB_SSL=auto            # auto | true | false
PORTAL_JWT_SECRET=<32+ chars>
PORTAL_JWT_REFRESH_SECRET=<32+ chars>
PORTAL_JWT_EXPIRY=15m
PORTAL_JWT_REFRESH_EXPIRY=7d
PORTAL_BCRYPT_SALT_ROUNDS=10
PORTAL_MAX_LOGIN_ATTEMPTS=5
PORTAL_LOCK_MINUTES=15

# Aprovisionamiento automático (cron) — activo por defecto
PORTAL_PROVISIONING_ENABLED=true
PORTAL_PROVISIONING_CRON=0 6 * * *        # diario 06:00
PORTAL_PROVISIONING_TZ=America/Caracas
PORTAL_PROVISIONING_RUN_ON_START=true     # pasada extra al arrancar

RESEND_API_KEY=<re_...>
RESEND_FROM="Portal Zona Start <no-reply@tu-dominio>"
OTP_TTL_SECONDS=600
OTP_MAX_ATTEMPTS=5
```

### `apps/portal/.env`
```env
# URL del SERVIDOR del backend (otra máquina/dominio en producción).
PORTAL_API_URL=https://api-portal.zonastart.com/api/portal
MAINTENANCE_MODE=false
# Solo dev/localhost: host del tenant a usar cuando el host real no resuelve.
# PORTAL_DEFAULT_TENANT_HOST=caja.caprebdt.local
```

## 2.b Arquitectura de despliegue (front y back en servidores distintos)

El portal usa patrón **BFF**: el **servidor del frontend (Astro)** es el único que habla con
`portal-api` (server-to-server); el navegador solo habla con Astro.

```
[Navegador] --HTTPS--> [Servidor FRONT: portal (Astro SSR)] --HTTP(S)--> [Servidor BACK: portal-api] --> [PostgreSQL]
```

Implicaciones al estar en **servidores separados**:

- `PORTAL_API_URL` debe apuntar al **backend por red** (p. ej. `https://api-portal.zonastart.com/api/portal`
  o una IP privada `http://10.0.0.5:3001/api/portal`).
- **No se necesita CORS** para el flujo normal: la llamada front→back es **servidor a servidor**.
  (`ALLOW_CORS_URL` queda solo por si algún día se llama a `portal-api` desde el navegador.)
- La cookie `portal_session` que emite `portal-api` **no la usa el navegador**: Astro la lee del
  `Set-Cookie` de la respuesta (server-to-server) y guarda **sus propias cookies** (`p_at`/`p_rt`)
  en el dominio del frontend. Por eso no hay problemas de cookies entre dominios.
- El navegador **nunca** necesita alcanzar `portal-api` → no lo expongas a Internet.
- Ambos servidores comparten la **misma base de datos** (para `portal-api`). El front no toca la BD.
- El **theming por tenant** se resuelve del lado del front llamando a `portal-api /tenant/resolve`.

> Alternativa (no recomendada): que el navegador consuma `portal-api` directamente. Requeriría
> CORS, exponer el backend y mover los tokens al navegador (menos seguro).

## 3. Orden de build

```bash
pnpm install

# 1) contratos (dependencia de portal-api)
pnpm --filter @repo/contracts build

# 2) API y frontend
pnpm --filter portal-api build        # -> apps/portal-api/dist
pnpm --filter portal build            # -> apps/portal/dist  (requiere Node >= 22.12)
```

> `turbo build` también sirve, pero recuerda que `portal` necesita Node ≥ 22.12 en el host/CI.
> No ejecutes el build de `portal` con Node 20 (Astro 7 lo rechaza).

## 4. Base de datos (una sola vez por entorno)

1. **Crear el rol** de mínimo privilegio (DBA): `docs/portal-asociados/ddl/portal-role-create.sql`.
2. **Aplicar migraciones** con un usuario **admin/migrador** (no `portal_app`):
   ```bash
   PORTAL_DATABASE_URL="postgresql://postgres:<pwd>@<host>/<db>?options=-c%20search_path=portal,savings,core,tenant,treasury,inventory,public" \
     pnpm --filter portal-api db:migrate
   ```
   Crea el esquema `portal` (+ FKs y grants) y registra en **`drizzle.__portal_migrations`**
   (tabla de tracking propia; no interfiere con el ERP).
3. **Aprovisionar** cuentas de asociados (idempotente):
   ```bash
   pnpm --filter portal-api sync:associates           # todos los tenants
   # o: pnpm --filter portal-api sync:associates <tenantId> [limit]
   ```
   > Se puede repetir cuando quieras: solo crea las cuentas que falten.

   **Alternativa automatizada (cron):** por defecto viene **activado** (diario a las **06:00**):
   ```env
   PORTAL_PROVISIONING_ENABLED=true
   PORTAL_PROVISIONING_CRON=0 6 * * *        # diario 06:00
   PORTAL_PROVISIONING_TZ=America/Caracas    # zona horaria del cron
   PORTAL_PROVISIONING_RUN_ON_START=true     # además, una pasada al arrancar
   ```
   Al arrancar, `portal-api` registra el job y, si `RUN_ON_START=true`, hace una **pasada
   inmediata** (útil tras reinicios); luego se repite en el horario del cron. En cada disparo
   recorre **todos los tenants activos** y crea solo las cuentas nuevas. Es **idempotente**.
   Para desactivarlo: `PORTAL_PROVISIONING_ENABLED=false` y usar el CLI manual.

## 4.b Multi-tenant: ¿cómo sabe el portal qué tenant usar?

- **El tenant se identifica por el host** (dominio): subdominio (`slug.PLATFORM_DOMAIN`) o
  **dominio personalizado verificado** (`tenant.tenant_domains`).
- El **frontend** (`apps/portal`) resuelve la marca con `portal-api GET /tenant/resolve?host=<host>`
  y la usa para theming; además envía el `tenantId` resuelto al hacer login.
- Los **datos** quedan acotados por el `tenant_id` de la **cuenta** (va en el JWT), no por variable.
- No hay que configurar el tenant por variable en producción. Solo en **dev (localhost)** se usa
  `PORTAL_DEFAULT_TENANT_HOST` para simular el host del tenant.

## 5. Arranque

Secuencia: **`portal-api` primero** (servidor BACK), luego `portal` (servidor FRONT).

> Pueden estar en el **mismo host** o en **dos servidores distintos**. Si son distintos, ajusta
> `PORTAL_API_URL` del front a la URL/IP del back (ver §2.b) y asegura conectividad de red entre ellos.

```bash
# Opción A · PM2 (ver deploy/ecosystem.config.cjs)
pm2 start deploy/ecosystem.config.cjs
pm2 save

# Opción B · manual
pnpm --filter portal-api start   # node dist/main  -> :3001
pnpm --filter portal start       # node dist/server/entry.mjs -> :4321
```

- **`portal`** (Astro SSR) es lo único expuesto a Internet (proxy inverso).
- **`portal-api`** queda en la red interna; el frontend lo consume del lado del servidor (BFF).

Ver `deploy/nginx.conf.sample` para el reverse proxy.

## 6. Modo mantenimiento

- Poner `MAINTENANCE_MODE=true` en `apps/portal/.env` y **reiniciar `portal`**.
- Todas las rutas redirigen a `/maintenance`.
- `MAINTENANCE_MODE=false` para reactivar.

## 7. Checklist de producción

- [ ] `NODE_ENV=production` en ambas apps (cookies `secure`, SSL de BD).
- [ ] Secretos en gestor de secretos (no en el repo).
- [ ] Dominio de Resend verificado (SPF/DKIM/DMARC); remitente correcto.
- [ ] `ALLOW_CORS_URL` con el dominio real del portal.
- [ ] HTTPS/TLS en el reverse proxy; `X-Forwarded-*` configurados.
- [ ] Rol `portal_app` con grants (lo aplica la migración `0001`/`0002`).
- [ ] Migraciones corridas con usuario admin; `portal_app` **sin** DDL.
- [ ] Aprovisionamiento ejecutado tras la carga mensual.
- [ ] Backups de la BD; monitoreo de `portal-api` (`/api/portal/health`) y de `portal`.
- [ ] Rotación de secretos (`PORTAL_JWT_*`, `RESEND_API_KEY`).
- [ ] (Escala) evaluar **réplica de lectura** para el portal si los cierres del ERP cargan el primario.

## 8. Healthchecks

| Servicio | URL |
|---|---|
| `portal-api` | `GET /api/portal/health` → `{"status":"ok"}` |
| `portal` | `GET /` (302 a `/login` o `/maintenance`) |
