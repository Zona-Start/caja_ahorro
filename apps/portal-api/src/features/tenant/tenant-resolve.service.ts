import { Env } from '@/common/config/envs';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import { tenantDomains, tenants } from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';

export interface TenantBrand {
  id: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

@Injectable()
export class TenantResolveService {
  private readonly platformDomain: string;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    config: ConfigService<Env, true>,
  ) {
    this.platformDomain = config
      .get('PLATFORM_DOMAIN', { infer: true })
      .toLowerCase();
  }

  private normalize(host: string): string {
    return host.trim().toLowerCase().replace(/\.$/, '').split(':')[0] ?? '';
  }

  private toBrand(tenant: typeof tenants.$inferSelect): TenantBrand {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug ?? null,
      logoUrl: tenant.logoUrl ?? null,
      faviconUrl: tenant.faviconUrl ?? null,
      primaryColor: tenant.primaryColor ?? null,
      secondaryColor: tenant.secondaryColor ?? null,
    };
  }

  /** Resuelve la marca del tenant por host (dominio personalizado o subdominio por slug). */
  async resolve(host: string): Promise<TenantBrand | null> {
    const normalized = this.normalize(host);

    // 1) Dominio personalizado verificado.
    const domain = await this.db.query.tenantDomains.findFirst({
      where: and(
        eq(tenantDomains.domain, normalized),
        eq(tenantDomains.isVerified, true),
      ),
    });
    if (domain) {
      const tenant = await this.db.query.tenants.findFirst({
        where: and(eq(tenants.id, domain.tenantId), eq(tenants.isActive, true)),
      });
      return tenant ? this.toBrand(tenant) : null;
    }

    // 2) Subdominio por slug (*.PLATFORM_DOMAIN).
    if (normalized.endsWith(`.${this.platformDomain}`)) {
      const slug = normalized.slice(0, -(this.platformDomain.length + 1));
      if (slug && !slug.includes('.')) {
        const tenant = await this.db.query.tenants.findFirst({
          where: and(eq(tenants.slug, slug), eq(tenants.isActive, true)),
        });
        if (tenant) return this.toBrand(tenant);
      }
    }

    return null;
  }
}
