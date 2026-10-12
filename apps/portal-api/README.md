# Portal del Asociado · portal-api

API NestJS 11 de autoservicio para asociados. Realm de identidad propio, acceso a datos con
Drizzle ORM y despliegue independiente del ERP (`apps/api`).

## Requisitos

- Node >= 20, pnpm 10
- PostgreSQL (misma instancia del ERP) con el esquema `portal` migrado y el rol `portal_app`.

## Puesta en marcha

```bash
# 1) build de los contratos compartidos (una vez, o en watch)
pnpm --filter @repo/contracts build

# 2) variables de entorno
cp .env.example .env   # y ajustar valores

# 3) migraciones del esquema `portal`
pnpm --filter portal-api db:generate
pnpm --filter portal-api db:migrate

# 4) desarrollo
pnpm --filter portal-api dev
```

Docs de diseño: `docs/portal-asociados/` (raíz del monorepo).
