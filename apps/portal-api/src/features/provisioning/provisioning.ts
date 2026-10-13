import * as bcrypt from 'bcryptjs';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PORTAL_ALLOWED_ASSOCIATE_STATUSES } from '../../common/constants/associate-access';
import * as schema from '../../database/schema';

export interface ProvisionOptions {
  /** Si se indica, solo se aprovisionan asociados de ese tenant. */
  tenantId?: string;
  /** Si se indica, solo se aprovisionan esas cédulas. */
  cedulas?: string[];
  /** Límite de asociados a aprovisionar (útil para pruebas/pilotos). */
  limit?: number;
  saltRounds?: number;
}

export interface ProvisionResult {
  total: number;
  created: number;
}

/**
 * Aprovisiona de forma IDEMPOTENTE las cuentas del portal para los asociados
 * que aún no tienen una: crea `portal.accounts` (usuario = cédula,
 * contraseña inicial = cédula) y `portal.associate_profile`.
 *
 * Diseñado para ejecutarse tras la carga mensual de asociados/haberes.
 */
export async function provisionAssociates(
  db: NodePgDatabase<typeof schema>,
  options: ProvisionOptions = {},
): Promise<ProvisionResult> {
  const saltRounds = options.saltRounds ?? 10;

  const conditions = [isNull(schema.portalAccounts.id)];
  // Solo se aprovisionan asociados con acceso permitido (ACTIVE/PENDING).
  conditions.push(
    inArray(schema.associates.status, [...PORTAL_ALLOWED_ASSOCIATE_STATUSES]),
  );
  if (options.tenantId) {
    conditions.push(eq(schema.associates.tenantId, options.tenantId));
  }
  if (options.cedulas && options.cedulas.length > 0) {
    conditions.push(inArray(schema.associates.cedula, options.cedulas));
  }

  const pending = await db
    .select({
      id: schema.associates.id,
      tenantId: schema.associates.tenantId,
      cedula: schema.associates.cedula,
      email: schema.associates.email,
      phone: schema.associates.phone,
      localityId: schema.associates.localityId,
    })
    .from(schema.associates)
    .leftJoin(
      schema.portalAccounts,
      and(
        eq(schema.portalAccounts.associateId, schema.associates.id),
        eq(schema.portalAccounts.tenantId, schema.associates.tenantId),
      ),
    )
    .where(and(...conditions))
    .orderBy(schema.associates.cedula)
    .limit(options.limit ?? 100000);

  let created = 0;

  for (const associate of pending) {
    const passwordHash = await bcrypt.hash(associate.cedula, saltRounds);

    await db.transaction(async (tx) => {
      const [account] = await tx
        .insert(schema.portalAccounts)
        .values({
          tenantId: associate.tenantId,
          associateId: associate.id,
          username: associate.cedula,
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: false,
          email: associate.email,
          phone: associate.phone,
        })
        .returning({ id: schema.portalAccounts.id });

      await tx.insert(schema.portalAssociateProfile).values({
        accountId: account.id,
        tenantId: associate.tenantId,
        localityId: associate.localityId,
        syncedAt: new Date(),
      });
    });

    created++;
  }

  return { total: pending.length, created };
}
