import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  tenantDomains,
  tenantMembers,
  tenants,
  users,
} from '@/database/schema';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, inArray } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface TenantBrand {
  id: string;
  name: string;
  slug: string | null;
  customDomain: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  loginMode: 'CUSTOM_DOMAIN' | 'SUBDOMAIN';
}

export interface ResolvedHost {
  type: 'platform' | 'subdomain' | 'custom' | 'unknown';
  slug?: string;
  domain?: string;
  tenant: TenantBrand | null;
}

const APP_SUBDOMAIN = 'app';
const RESERVED_SLUGS = ['app', 'www', 'api', 'admin'];

@Injectable()
export class TenantResolutionService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly configService: ConfigService,
  ) {}

  getPlatformDomain(): string {
    return (
      this.configService.get<string>('PLATFORM_DOMAIN') || 'zonastart.local'
    );
  }

  getAppHost(): string {
    return `${APP_SUBDOMAIN}.${this.getPlatformDomain().toLowerCase()}`;
  }

  normalizeHost(host: string): string {
    return host.trim().toLowerCase().replace(/\.$/, '').split(':')[0];
  }

  classifyHost(host: string): Pick<ResolvedHost, 'type' | 'slug' | 'domain'> {
    const normalized = this.normalizeHost(host);
    const platform = this.getPlatformDomain().toLowerCase();

    if (normalized === 'localhost' || normalized === '127.0.0.1') {
      return { type: 'platform' };
    }

    if (
      normalized === platform ||
      normalized === `www.${platform}` ||
      normalized === `${APP_SUBDOMAIN}.${platform}`
    ) {
      return { type: 'platform' };
    }

    if (normalized.endsWith(`.${platform}`)) {
      const slug = normalized.slice(0, -(platform.length + 1));
      if (slug && !slug.includes('.') && !RESERVED_SLUGS.includes(slug)) {
        return { type: 'subdomain', slug };
      }
    }

    return { type: 'custom', domain: normalized };
  }

  private async getPrimaryDomain(tenantId: string): Promise<string | null> {
    const domain = await this.db.query.tenantDomains.findFirst({
      where: and(
        eq(tenantDomains.tenantId, tenantId),
        eq(tenantDomains.isVerified, true),
      ),
      orderBy: (d, { desc }) => [desc(d.isPrimary)],
    });
    return domain?.domain ?? null;
  }

  private async toBrand(
    tenant: typeof tenants.$inferSelect,
  ): Promise<TenantBrand> {
    const customDomain = await this.getPrimaryDomain(tenant.id);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      customDomain,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      loginMode: tenant.loginMode,
    };
  }

  async resolveHost(host: string): Promise<ResolvedHost> {
    const classified = this.classifyHost(host);

    if (classified.type === 'platform') {
      return { type: 'platform', tenant: null };
    }

    if (classified.type === 'subdomain') {
      const tenant = await this.db.query.tenants.findFirst({
        where: and(
          eq(tenants.slug, classified.slug!),
          eq(tenants.isActive, true),
        ),
      });
      return {
        type: 'subdomain',
        slug: classified.slug,
        tenant: tenant ? await this.toBrand(tenant) : null,
      };
    }

    const domain = await this.db.query.tenantDomains.findFirst({
      where: and(
        eq(tenantDomains.domain, classified.domain!),
        eq(tenantDomains.isVerified, true),
      ),
    });

    if (!domain) {
      return { type: 'custom', domain: classified.domain, tenant: null };
    }

    const tenant = await this.db.query.tenants.findFirst({
      where: and(eq(tenants.id, domain.tenantId), eq(tenants.isActive, true)),
    });

    return {
      type: 'custom',
      domain: classified.domain,
      tenant: tenant ? await this.toBrand(tenant) : null,
    };
  }

  async lookupByEmail(
    email: string,
  ): Promise<{ tenants: TenantBrand[]; isSystemAdmin: boolean }> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    });

    if (!user) {
      return { tenants: [], isSystemAdmin: false };
    }

    if (user.isSystemAdmin) {
      return { tenants: [], isSystemAdmin: true };
    }

    const memberships = await this.db.query.tenantMembers.findMany({
      where: and(
        eq(tenantMembers.userId, user.id),
        eq(tenantMembers.isActive, true),
      ),
      columns: { tenantId: true },
    });

    if (memberships.length === 0) {
      return { tenants: [], isSystemAdmin: false };
    }

    const tenantIds = memberships.map((m) => m.tenantId);
    const tenantRows = await this.db.query.tenants.findMany({
      where: and(inArray(tenants.id, tenantIds), eq(tenants.isActive, true)),
    });

    const brands = await Promise.all(
      tenantRows.map((tenant) => this.toBrand(tenant)),
    );

    return { tenants: brands, isSystemAdmin: false };
  }
}
