import { Env } from '@/common/config/envs';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import { tenants } from '@/database/schema';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { provisionAssociates, ProvisionResult } from './provisioning';

export interface ProvisionAllResult {
  tenants: number;
  total: number;
  created: number;
}

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);
  private readonly saltRounds: number;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    config: ConfigService<Env, true>,
  ) {
    this.saltRounds = config.get('PORTAL_BCRYPT_SALT_ROUNDS', { infer: true });
  }

  /** Aprovisiona cuentas del portal para asociados sin acceso (de un tenant o de todos). */
  async run(tenantId?: string): Promise<ProvisionResult> {
    const result = await provisionAssociates(this.db, {
      tenantId,
      saltRounds: this.saltRounds,
    });
    this.logger.log(
      `Aprovisionamiento${tenantId ? ` (tenant ${tenantId})` : ''}: nuevos=${result.created} de ${result.total}.`,
    );
    return result;
  }

  /** Aprovisiona para todos los tenants activos (uso del cron). */
  async runAll(): Promise<ProvisionAllResult> {
    const activeTenants = await this.db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.isActive, true));

    let total = 0;
    let created = 0;
    for (const tenant of activeTenants) {
      const result = await provisionAssociates(this.db, {
        tenantId: tenant.id,
        saltRounds: this.saltRounds,
      });
      total += result.total;
      created += result.created;
    }

    return { tenants: activeTenants.length, total, created };
  }
}
