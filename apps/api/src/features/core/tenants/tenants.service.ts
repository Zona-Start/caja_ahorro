import * as schema from '@/database/schema';
import { tenantDomains, tenants } from '@/database/schema';
import { TenantCreatedEvent } from '@/database/seeds/seed-tenants-default.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import { and, eq, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { AuditHelper } from '../../audit/audit-event.service';
import { CreateTenantDomainDto } from './dto/tenant-domains.dto';
import { ConfigureIntegrationDto } from './dto/tenant-integrations.dto';
import { ToggleModuleDto } from './dto/tenant-modules.dto';
import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantDto,
} from './dto/tenants.dto';
import { TenantIntegrationService } from './services/tenant-integrations.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
    private eventEmitter: EventEmitter2,
    private readonly provisioningService: TenantProvisioningService,
    private readonly integrationService: TenantIntegrationService,
  ) {}

  async findAll(dto: TenantQueryDto, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const { page = 1, limit = 20, search, isActive, businessType } = dto;
    const offset = (page - 1) * limit;

    return db.query.tenants.findMany({
      where: (tenants, { and, or, eq, like }) => {
        const conditions: SQL[] = [];

        if (isActive !== undefined) {
          conditions.push(eq(tenants.isActive, isActive));
        }

        if (businessType) {
          conditions.push(eq(tenants.businessType, businessType));
        }

        if (search) {
          const searchFilter = or(
            like(tenants.name, `%${search}%`),
            like(tenants.rif, `%${search}%`),
            like(tenants.email, `%${search}%`),
          );

          if (searchFilter) {
            conditions.push(searchFilter);
          }
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      orderBy: (t, { asc }) => [asc(t.name)],
      limit,
      offset,
    });
  }

  async findById(
    id: string,
    currentTenantId?: string,
    isSystemAdmin: boolean = true,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    if (!isSystemAdmin && id !== currentTenantId) {
      throw new ForbiddenException(
        'No tienes permiso para consultar este Tenant',
      );
    }

    const tenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findByRif(rif: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    return db.query.tenants.findFirst({ where: (t, { eq }) => eq(t.rif, rif) });
  }

  async findBySlug(slug: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    return db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.slug, slug),
    });
  }

  private async ensureSlugAvailable(slug?: string) {
    if (!slug) return;
    const existing = await this.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`El slug "${slug}" ya está en uso`);
    }
  }

  async create(dto: CreateTenantDto, userId?: string) {
    const existing = await this.findByRif(dto.rif);
    if (existing)
      throw new ConflictException('Tenant with this RIF already exists');

    await this.ensureSlugAvailable(dto.slug);

    const [tenant] = await this.db
      .insert(tenants)
      .values({
        name: dto.name,
        rif: dto.rif,
        email: dto.email,
        businessType: dto.businessType,
        address: dto.address,
        phone: dto.phone,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        contactCedula: dto.contactCedula,
        slug: dto.slug,
        logoKey: dto.logoKey,
        logoUrl: dto.logoUrl,
        faviconKey: dto.faviconKey,
        faviconUrl: dto.faviconUrl,
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        loginMode: dto.loginMode,
        createdBy: userId || null,
        updatedBy: userId || null,
      } as unknown as typeof tenants.$inferInsert)
      .returning();

    await this.auditHelper.logCreate(undefined, 'tenant', tenant, {
      targetId: tenant.id,
      description: `Created tenant ${tenant.name}`,
    });

    this.eventEmitter.emit(
      'tenant.created',
      new TenantCreatedEvent(
        tenant.id,
        dto.businessType,
        dto.moduleCodes,
        userId,
      ),
    );

    return tenant;
  }

  async update(
    id: string,
    dto: UpdateTenantDto,
    isSystemAdmin: boolean,
    currentTenantId?: string,
    userId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    if (!isSystemAdmin && id !== currentTenantId) {
      throw new ForbiddenException(
        'Solo puedes actualizar datos de tu propia empresa',
      );
    }

    const previous = await this.findById(
      id,
      currentTenantId,
      isSystemAdmin,
      tx,
    );

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: userId || null,
    };

    if (isSystemAdmin) {
      if (dto.name) updateData.name = dto.name;
      if (dto.email) updateData.email = dto.email;
      if (dto.businessType) updateData.businessType = dto.businessType;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
      if (dto.address) updateData.address = dto.address;
      if (dto.phone) updateData.phone = dto.phone;
      if (dto.slug !== undefined) {
        if (dto.slug && dto.slug !== previous.slug) {
          await this.ensureSlugAvailable(dto.slug);
        }
        updateData.slug = dto.slug || null;
      }
      if (dto.loginMode) updateData.loginMode = dto.loginMode;
    }

    if (dto.logoKey !== undefined) updateData.logoKey = dto.logoKey;
    if (dto.logoUrl !== undefined) updateData.logoUrl = dto.logoUrl;
    if (dto.faviconKey !== undefined) updateData.faviconKey = dto.faviconKey;
    if (dto.faviconUrl !== undefined) updateData.faviconUrl = dto.faviconUrl;
    if (dto.primaryColor !== undefined)
      updateData.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined)
      updateData.secondaryColor = dto.secondaryColor;

    if (dto.contactName) updateData.contactName = dto.contactName;
    if (dto.contactPhone) updateData.contactPhone = dto.contactPhone;
    if (dto.contactEmail) updateData.contactEmail = dto.contactEmail;
    if (dto.contactCedula) updateData.contactCedula = dto.contactCedula;

    const [updated] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, id))
      .returning();

    const newModuleCodes = dto.moduleCodes;
    if (newModuleCodes) {
      const currentModules = await this.provisioningService.findAllByTenant(id);
      const activeCodes = currentModules
        .filter((m) => m.status === 'ENABLED')
        .map((m) => m.moduleCode);

      const codesToAdd = newModuleCodes.filter(
        (c) => !activeCodes.includes(c as any),
      );
      const codesToRemove = activeCodes.filter(
        (c) => !newModuleCodes.includes(c as any),
      );

      for (const code of codesToAdd) {
        await this.provisioningService.activate(id, code, userId, tx);
      }
      for (const code of codesToRemove) {
        await this.provisioningService.deactivate(id, code, userId, tx);
      }
    }

    await this.auditHelper.logUpdate(
      userId || undefined,
      'tenant',
      previous,
      updated,
      {
        targetId: id,
        description: `Updated tenant ${previous.name}`,
      },
    );

    return updated;
  }

  async remove(id: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const previous = await this.findById(id, id, true, tx);
    await db
      .update(tenants)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(tenants.id, id));

    await this.auditHelper.logDelete(undefined, 'tenant', previous, {
      targetId: id,
      description: `Deactivated tenant ${previous.name}`,
    });

    return { message: 'Tenant deactivated successfully' };
  }

  async getActiveCount(tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const result = await db.query.tenants.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
    });
    return result.length;
  }

  async toggleModule(tenantId: string, dto: ToggleModuleDto, userId?: string) {
    await this.findById(tenantId, tenantId, true);

    return this.db.transaction(async (tx) => {
      const result = await this.provisioningService.toggleStatus(
        tenantId,
        dto.moduleCode,
        dto.status,
        userId,
        tx,
      );

      await this.auditHelper.logUpdate(
        userId,
        'tenant_module',
        { tenantId, moduleCode: dto.moduleCode },
        { tenantId, moduleCode: dto.moduleCode, status: dto.status },
        {
          targetId: tenantId,
          description: `Module ${dto.moduleCode} set to ${dto.status}`,
        },
      );

      return result;
    });
  }

  async configureIntegration(tenantId: string, dto: ConfigureIntegrationDto) {
    await this.findById(tenantId, tenantId, true);

    return this.db.transaction(async (tx) => {
      const result = await this.integrationService.configure(tenantId, dto, tx);

      await this.auditHelper.logCreate(
        undefined,
        'tenant_module_integration',
        { tenantId, ...dto },
        {
          targetId: tenantId,
          description: `Integration ${dto.sourceModule} -> ${dto.targetModule} configured`,
        },
      );

      return result;
    });
  }

  async listModules(tenantId: string, status?: string) {
    await this.findById(tenantId, tenantId, true);
    return this.provisioningService.findAllByTenant(tenantId, status);
  }

  async listIntegrations(tenantId: string, isEnabled?: boolean) {
    await this.findById(tenantId, tenantId, true);
    return this.integrationService.findAllByTenant(tenantId, isEnabled);
  }

  async listDomains(tenantId: string) {
    await this.findById(tenantId, tenantId, true);
    return this.db.query.tenantDomains.findMany({
      where: eq(tenantDomains.tenantId, tenantId),
      orderBy: (d, { desc }) => [desc(d.isPrimary)],
    });
  }

  async addDomain(
    tenantId: string,
    dto: CreateTenantDomainDto,
    userId?: string,
  ) {
    await this.findById(tenantId, tenantId, true);

    const domain = dto.domain.trim().toLowerCase();
    const existing = await this.db.query.tenantDomains.findFirst({
      where: eq(tenantDomains.domain, domain),
    });
    if (existing) {
      throw new ConflictException(`El dominio "${domain}" ya está registrado`);
    }

    const verificationToken = randomBytes(24).toString('hex');

    const [created] = await this.db
      .insert(tenantDomains)
      .values({
        tenantId,
        domain,
        isPrimary: dto.isPrimary ?? false,
        isVerified: false,
        verificationToken,
        createdById: userId || null,
        updatedById: userId || null,
      })
      .returning();

    await this.auditHelper.logCreate(tenantId, 'tenant_domain', created, {
      targetId: tenantId,
      description: `Registered custom domain ${domain}`,
    });

    return { domain: created, verificationToken };
  }

  async verifyDomain(tenantId: string, verificationToken: string) {
    const domain = await this.db.query.tenantDomains.findFirst({
      where: and(
        eq(tenantDomains.tenantId, tenantId),
        eq(tenantDomains.verificationToken, verificationToken),
      ),
    });

    if (!domain) {
      throw new NotFoundException('Token de verificación inválido');
    }

    const [updated] = await this.db
      .update(tenantDomains)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verificationToken: null,
        updatedById: null,
      })
      .where(eq(tenantDomains.id, domain.id))
      .returning();

    return updated;
  }

  async removeDomain(tenantId: string, domainId: string) {
    await this.findById(tenantId, tenantId, true);

    const existing = await this.db.query.tenantDomains.findFirst({
      where: and(
        eq(tenantDomains.id, domainId),
        eq(tenantDomains.tenantId, tenantId),
      ),
    });
    if (!existing) {
      throw new NotFoundException('Dominio no encontrado');
    }

    await this.db.delete(tenantDomains).where(eq(tenantDomains.id, domainId));

    return { message: 'Dominio eliminado correctamente' };
  }
}
