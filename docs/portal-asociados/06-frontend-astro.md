# 06 · Frontend `apps/portal` (Astro 7 + React)

Portal de autoservicio del asociado. **SSR** con Astro y **React islands**, consumiendo
`portal-api` mediante patrón **BFF** (la sesión vive en cookies `httpOnly` gestionadas por Astro;
el navegador nunca maneja tokens).

## Requisitos

- **Node.js ≥ 22.12.0** (Astro 7).
- `portal-api` corriendo (por defecto en `http://localhost:3001/api/portal`).

## Estructura

```
apps/portal/
├── astro.config.mjs        # output: server · adapter @astrojs/node · astro:env
├── src/
│   ├── middleware.ts       # mantenimiento + guard de /dashboard
│   ├── lib/
│   │   ├── session.ts      # cookies p_at / p_rt (httpOnly)
│   │   └── portal-api.ts   # login/refresh/get contra portal-api
│   ├── layouts/Base.astro  # layout + estilos globales
│   ├── components/LogoutButton.tsx   # React island
│   └── pages/
│       ├── index.astro         # decide: dashboard o login
│       ├── maintenance.astro   # pantalla de mantenimiento
│       ├── login.astro         # formulario de ingreso
│       ├── dashboard.astro     # panel del asociado (SSR)
│       └── api/{login,logout}.ts
└── .env
```

## Variables de entorno (`astro:env`)

| Variable | Alcance | Default | Descripción |
|---|---|---|---|
| `PORTAL_API_URL` | server (secret) | `http://localhost:3001/api/portal` | Base de `portal-api` |
| `MAINTENANCE_MODE` | server (secret) | `false` | Si es `true`, **todo** redirige a `/maintenance` |

```env
PORTAL_API_URL=http://localhost:3001/api/portal
MAINTENANCE_MODE=false
```

## Modo mantenimiento

En `src/middleware.ts`:
- `MAINTENANCE_MODE=true` → cualquier ruta redirige a `/maintenance`.
- `MAINTENANCE_MODE=false` → `/maintenance` redirige a `/`, y el sitio opera normal.

Es la forma de "apagar" el portal sin bajar el proceso (cambiar la variable y reiniciar).

## Flujo de autenticación (BFF)

1. `POST /api/login` (Astro) → llama a `portal-api /auth/login` con cédula/contraseña.
2. Astro lee el refresh token del `Set-Cookie` de `portal-api` y guarda **sus propias cookies**
   `p_at` (access, 15 min) y `p_rt` (refresh, 7 días), ambas `httpOnly`.
3. `dashboard.astro` (SSR) llama a `portal-api /me/*` con `Authorization: Bearer` del access token.
   Si recibe **401**, intenta `apiRefresh` y reintenta; si falla, limpia sesión y redirige a `/login`.
4. `POST /api/logout` limpia cookies y redirige a `/login`.

> El navegador **nunca** ve tokens: solo cookies `httpOnly`.

## Theming por tenant

Igual que el ERP, el portal toma los **tonos base** de `@repo/shadcn` y aplica la **marca del
tenant** encima:

- **Resolución del tenant por host**: en `middleware.ts` se llama a
  `portal-api GET /tenant/resolve?host=<host>` (dominio personalizado verificado o subdominio
  por `slug`) y se guarda en `Astro.locals.tenant` (cache en memoria 5 min).
- `Base.astro` inyecta en `<html>` las variables de marca: `--primary`, `--primary-foreground`,
  `--ring`, `--secondary`, `--secondary-foreground` (con contraste calculado igual que el ERP),
  además del **favicon** del tenant.
- `Topbar` y `login` muestran el **logo** y el **nombre** del tenant.
- **Selector claro/oscuro** en el Topbar (isla `ThemeToggle`): arranca en oscuro (como el ERP),
  persiste en `localStorage` (`portal-theme`) y aplica el tema **antes del primer pintado**
  (script inline en `Base.astro`, sin parpadeo).
- En dev (`localhost`), `PORTAL_DEFAULT_TENANT_HOST` fuerza el host del tenant a usar.

## Ejecución

```bash
# Requiere Node >= 22.12
pnpm --filter portal dev        # http://localhost:4321
pnpm --filter portal build      # salida SSR en dist/
pnpm --filter portal preview
```

## Alcance actual (Fase 5 · v1)

- **Login** (cédula/cédula).
- **Dashboard** con estado de cuenta + **tabs paginadas**: Haberes · Retiros · Préstamos · Créditos · Historial.
- **Perfil** (`/perfil`): edición de **correo, teléfono y dirección** (la localidad forma parte de la dirección).
  - El resto de los datos es **solo lectura**.
  - Cambios de correo/teléfono exigen **OTP** al nuevo valor (flujo: enviar código → verificar → guardar).
- **Detalles** (`/prestamo/:id`, `/credito/:id`, `/retiro/:id`): info del crédito/préstamo/retiro, plan de amortización y resumen (pagado/pendiente/cuotas).
- **Excesos / Movimientos**: conteo por tipo (filtro) + listado de movimientos del tipo seleccionado.
- **Filtro en vivo** de la tabla (buscador) en todas las tabs.
- **Seguridad** (`/seguridad`): cambio de contraseña opcional.
- **Logout** (isla React).
- **Modo mantenimiento** por variable de entorno.

### Endpoints BFF (Astro)

| Ruta | Reenvía a |
|---|---|
| `POST /api/login` · `POST /api/logout` | portal-api `/auth/*` |
| `POST /api/profile/update` | portal-api `PATCH /me/profile` |
| `POST /api/profile/change-password` | portal-api `POST /auth/change-password` |
| `POST /api/profile/otp-request` · `otp-verify` | portal-api `/otp/*` |
| `GET /api/catalog/municipalities` · `parishes` · `resolve` | portal-api `/catalog/*` |

> Los detalles (`/prestamo/:id`, `/credito/:id`, `/retiro/:id`) se cargan **SSR** directamente
> contra `portal-api` (sin endpoint BFF intermedio).

### Pendiente (siguiente iteración del frontend)

- Filtros por fecha/búsqueda en el backend (hoy el filtro de tabla es en vivo, del lado del cliente).
