# 04 · Esquema y migraciones con Drizzle ORM

> El esquema `portal` se define en **TypeScript** y la migración SQL se **genera** con
> `drizzle-kit`. El archivo [`ddl/portal-schema.sql`](./ddl/portal-schema.sql) es solo una
> **referencia** de lo que Drizzle producirá (no se ejecuta a mano).

## 1. Estructura de archivos propuesta

Se respeta exactamente el patrón actual del ERP (`apps/api/src/database/schema`). Como se
acordó crear `packages/database` (fuente única del esquema), estos archivos viven ahí:

```
packages/database/src/
├── _schemas.ts                     (+ portalSchema = pgSchema('portal'))
├── timestamps.ts                   (reutilizado)
├── drizzle.config.ts               (+ 'portal' en schemaFilter)
├── schema/
│   ├── index.ts                    (exporta enum, relations, tables, views)
│   ├── enum/
│   │   ├── index.ts                (+ export * from './portal.enum')
│   │   └── portal.enum.ts          (NUEVO · enums del portal)
│   ├── tables/
│   │   ├── index.ts                (+ exports de portal)
│   │   └── portal.ts               (NUEVO · tablas del portal)
│   └── relations/
│       ├── index.ts                (+ export * from './portal')
│       └── portal.ts               (NUEVO · relaciones del portal)
└── migrations/                     (salida de drizzle-kit generate)
```

> Nota: si en Fase 1 se decide mantenerlo dentro de `apps/api` por simplicidad, los mismos
> archivos viven en `apps/api/src/database/schema/...`. Lo importante es **una sola definición**.

## 2. Cambios de convención requeridos

### 2.1 `_schemas.ts`
```ts
import { pgSchema } from 'drizzle-orm/pg-core';

// ... esquemas existentes ...
export const portalSchema = pgSchema('portal'); // NUEVO
```

### 2.2 `drizzle.config.ts` (`schemaFilter`)
```ts
schemaFilter: [
  'public',
  'auth',
  'accounting',
  'savings',
  'treasury',
  'purchasing',
  'inventory',
  'core',
  'audit',
  'sales',
  'portal', // NUEVO — imprescindible para que drizzle-kit gestione el esquema
],
```

### 2.3 `tables/index.ts`
```ts
export {
  portalAccessLog,
  portalAccounts,
  portalAssociateProfile,
  portalEmailLog,
  portalOtpCodes,
  portalSessions,
} from './portal';
```

### 2.4 `enum/index.ts`
```ts
export * from './portal.enum';
```

### 2.5 `relations/index.ts`
```ts
export * from './portal';
```

## 3. Flujo de migración

```bash
# 1) Generar la migración SQL a partir del esquema TS
pnpm db:generate          # -> packages/database/src/migrations/00XX_xxx.sql

# 2) Revisar el SQL generado (CREATE SCHEMA portal, tablas, índices, FKs)
# 3) Aplicar
pnpm db:migrate

# 4) Permisos del rol: drizzle-kit NO gestiona roles/GRANTs.
#    Se aplican con una migración "custom" (SQL crudo) o por el DBA:
pnpm --filter api db:generate-custom --name=portal-role-grants
#    y se pega el contenido de ddl/portal-role-grants.sql en el archivo generado.
```

### Migraciones custom (SQL crudo)
El proyecto ya dispone de `db:generate-custom` (ver `apps/api/package.json`). Se usa para:
- Los `GRANT`/`ALTER ROLE` de `portal_app`.
- Cualquier `CREATE SCHEMA IF NOT EXISTS portal` defensivo (aunque Drizzle lo genera).
- Funciones SQL auxiliares, si hicieran falta.

## 4. Enums del portal

```ts
// enum/portal.enum.ts
import { pgEnum } from 'drizzle-orm/pg-core';
import { portalSchema } from '../_schemas';

export const portalAccountStatusEnum = portalSchema.enum('account_status', [
  'PENDING_ACTIVATION',
  'ACTIVE',
  'LOCKED',
  'DISABLED',
]);

export const portalOtpPurposeEnum = portalSchema.enum('otp_purpose', [
  'EMAIL_VERIFY',
  'PHONE_VERIFY',
  'RESET',
  'STEP_UP',
]);

export const portalAccessEventEnum = portalSchema.enum('access_event', [
  'LOGIN',
  'LOGIN_FAILED',
  'LOGOUT',
  'READ',
  'PROFILE_UPDATE',
  'PASSWORD_CHANGE',
  'OTP_SENT',
]);

export const portalEmailStatusEnum = portalSchema.enum('email_status', [
  'QUEUED',
  'SENT',
  'FAILED',
]);
```

> Los enums con `portalSchema.enum(...)` se crean dentro del esquema `portal`, evitando
> colisiones de nombres con enums del ERP.

## 5. Esquema de referencia

El código TypeScript completo de las tablas y relaciones está en:

- [`drizzle/portal.schema.reference.ts`](./drizzle/portal.schema.reference.ts)

Ese archivo es una **referencia lista para integrar** en `packages/database/src/schema/tables/portal.ts`
(renombrar y ajustar imports según la ubicación final). No está conectado a la app.

## 6. Compatibilidad con el DDL de referencia

| Elemento | Drizzle | Notas |
|---|---|---|
| Esquema | `portalSchema = pgSchema('portal')` | debe estar en `schemaFilter` |
| PK uuid | `t.uuid('id').primaryKey().defaultRandom()` | `gen_random_uuid()` |
| PK serial grande | `t.bigserial('id', { mode: 'number' }).primaryKey()` | logs |
| Índices únicos parciales | `.uniqueIndex('...').on(...).where(sql\`deleted_at IS NULL\`)` | `accounts` |
| Timestamps | `timestampsShort` (createdAt/updatedAt) | patrón del repo |
| FKs | `references(() => associates.id, { onDelete: 'cascade' })` | a `savings`/`core`/`tenant` |

## 7. Capa de acceso a datos (portal-api) — **Drizzle ORM**

`portal-api` usa **Drizzle ORM** para **todo** el acceso a base de datos (consultar, crear,
actualizar y eliminar), replicando exactamente el patrón del ERP. **No se usa SQL crudo para
operaciones de datos.**

### 7.1 Provider (mismo patrón que `apps/api`)
```ts
// portal-api/src/database/drizzle-provider.ts
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@repo/database/schema'; // esquema compartido (packages/database)

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';
export type DrizzleDatabase = NodePgDatabase<typeof schema>;

export const DrizzleProvider = {
  provide: DRIZZLE_PROVIDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.get('PORTAL_DATABASE_URL'), // usuario portal_app
      max: 10,                                               // pool propio y acotado
      ssl: config.get('NODE_ENV') === 'production'
        ? { rejectUnauthorized: false }
        : false,
      statement_timeout: 5_000,                              // defensa contra consultas colgadas
      idle_in_transaction_session_timeout: 15_000,
      lock_timeout: 3_000,
    });
    return drizzle(pool, { schema }) as DrizzleDatabase;
  },
};
```

- **Pool separado** del ERP (no comparte conexiones con la API principal).
- Conexión con el rol **`portal_app`** (`PORTAL_DATABASE_URL`), no con el rol del ERP.
- `search_path` debe incluir `portal` (vía `options` en `PORTAL_DATABASE_URL`), igual que hoy
  el ERP incluye `public,auth,tenant,core,...`.

### 7.2 Uso en servicios
```ts
@Injectable()
export class PortalAssociateService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // Lectura tipada y parametrizada (sin SQL crudo)
  async getStatement(associateId: string, tenantId: string) {
    return this.db.query.associates.findFirst({
      where: and(
        eq(schema.associates.id, associateId),        // ← siempre desde el token
        eq(schema.associates.tenantId, tenantId),
      ),
    });
  }

  // Escritura de perfil (columnas allowlist)
  async updateContact(associateId: string, tenantId: string, data: ProfileUpdate) {
    return this.db
      .update(schema.associates)
      .set({ phone: data.phone, email: data.email, localityId: data.localityId })
      .where(and(eq(schema.associates.id, associateId),
                 eq(schema.associates.tenantId, tenantId)));
  }
}
```

### 7.3 Principios
- **CRUD completo vía Drizzle** (`select`/`insert`/`update`/`delete` y `db.query.*`), con bind
  de parámetros (mitiga inyección SQL — ver T3 en el threat model).
- **Identidad desde el token**: los `where` de miembro siempre incluyen `associateId` + `tenantId`
  derivados del JWT, nunca de parámetros del cliente.
- **Lecturas**: transacción `READ ONLY` (`tx.execute(sql\`SET TRANSACTION READ ONLY\`)`) y consultas
  paginadas.
- **Aprovisionamiento**: el listener `associate.created` hace el `upsert` de `portal.accounts` con
  Drizzle (idempotente).
- **Read-model/proyección** (escala): también con Drizzle, escribiendo en `portal.*`.

### 7.4 Única excepción a Drizzle: permisos
- Los `GRANT`/`ALTER ROLE` de `portal_app` **no los gestiona Drizzle** (no es su dominio): van en
  una **migración custom** (`db:generate-custom`) con SQL, ver
  [`ddl/portal-role-grants.sql`](./ddl/portal-role-grants.sql).
- No hay ninguna otra operación de datos en SQL crudo.

## 8. Aislamiento de migraciones (misma BD, contabilidad separada)

El ERP (`apps/api`) y `portal-api` comparten la **misma base de datos**, pero cada uno gestiona
migraciones de forma **independiente**:

| Aspecto | `apps/api` (ERP) | `apps/portal-api` |
|---|---|---|
| Config | `apps/api/src/drizzle.config.ts` | `apps/portal-api/src/drizzle.config.ts` |
| `schema` (entry) | `./src/database/schema` (todos los dominios) | `./src/database/schema/portal.ts` (solo portal) |
| `schemaFilter` | `auth, accounting, savings, …` | `['portal']` |
| Carpeta de salida | `apps/api/src/database/migrations` | `apps/portal-api/src/database/migrations` |
| Journal local | `apps/api/.../meta/_journal.json` | `apps/portal-api/.../meta/_journal.json` |
| **Tabla de tracking** | `drizzle.__drizzle_migrations` (default) | **`drizzle.__portal_migrations`** |

**Por qué los archivos de migración no se mezclan:** drizzle-kit genera a partir de su propio
`schema` entry + `schemaFilter`, y escribe en su propia carpeta/journal. Como el entry de
`portal-api` exporta **solo** objetos del esquema `portal` (y su `schemaFilter` es `['portal']`),
el ERP nunca ve migraciones de portal ni viceversa.

**Riesgo crítico evitado:** por defecto, drizzle-kit usa la MISMA tabla de tracking
(`drizzle.__drizzle_migrations`) para cualquier proyecto sobre la misma BD. Al tener journals
distintos pero una tabla compartida, el "último aplicado" (ordenado por `created_at`) se mezcla y
**una app puede saltarse migraciones de la otra**. Por eso `portal-api` define su **propia tabla**:

```ts
migrations: { schema: 'drizzle', table: '__portal_migrations' },
```

Resultado: el ERP y el portal aplican y rastrean migraciones de forma totalmente aislada, aunque
compartan la base de datos. El ERP no requiere cambios.
