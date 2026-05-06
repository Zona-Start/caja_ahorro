import * as schema from '@/database/schema';
import { tenants } from '@/database/schema';

import { TenantCreatedEvent } from '@/database/seeds/seed-tenants-default.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DRIZZLE_PROVIDER } from 'src/database/drizzle-provider';
import { AuditHelper } from '../../audit/audit-event.service';
import {
  CreateTenantDto,
  TenantQueryDto,
  UpdateTenantDto,
} from './dto/tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
    private readonly auditHelper: AuditHelper,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(dto: TenantQueryDto, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const { page = 1, limit = 20, search, isActive } = dto;
    const offset = (page - 1) * limit;

    return db.query.tenants.findMany({
      // El error "never" desaparece al definir el tipo SQL[]
      where: (tenants, { and, or, eq, like }) => {
        const conditions: SQL[] = []; // <--- ESTA ES LA CLAVE

        if (isActive !== undefined) {
          conditions.push(eq(tenants.isActive, isActive));
        }

        if (search) {
          const searchFilter = or(
            like(tenants.name, `%${search}%`),
            like(tenants.rif, `%${search}%`),
            like(tenants.email, `%${search}%`),
          );

          // Solo hacemos push si searchFilter no es undefined
          if (searchFilter) {
            conditions.push(searchFilter);
          }
        }

        // Ahora TypeScript sabe que "and(...)" devuelve un tipo válido o undefined
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

    // Strict isolation: if not system admin, can ONLY see their own tenant
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

  async create(dto: CreateTenantDto) {
    const db = this.db;
    const existing = await this.findByRif(dto.rif, db);
    if (existing)
      throw new ConflictException('Tenant with this RIF already exists');

    const [tenant] = await db
      .insert(tenants)
      .values({
        name: dto.name,
        rif: dto.rif,
        email: dto.email,
        address: dto.address,
        phone: dto.phone,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        contactCedula: dto.contactCedula,
      } as unknown as typeof tenants.$inferInsert)
      .returning();

    await this.auditHelper.logCreate(undefined, 'tenant', tenant, {
      targetId: tenant.id,
      description: `Created tenant ${tenant.name}`,
    });

    this.eventEmitter.emit('tenant.created', new TenantCreatedEvent(tenant.id));

    return tenant;
  }

  async update(
    id: string,
    dto: UpdateTenantDto,
    isSystemAdmin: boolean,
    currentTenantId?: string,
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;

    // Validar acceso: admin solo puede editar su propio tenant
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

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (isSystemAdmin) {
      // Superadmin can update everything
      if (dto.name) updateData.name = dto.name;
      if (dto.email) updateData.email = dto.email;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
      if (dto.address) updateData.address = dto.address;
      if (dto.phone) updateData.phone = dto.phone;
    }

    // Both Superadmin and Admin can update contact data

    if (dto.contactName) updateData.contactName = dto.contactName;
    if (dto.contactPhone) updateData.contactPhone = dto.contactPhone;
    if (dto.contactEmail) updateData.contactEmail = dto.contactEmail;
    if (dto.contactCedula) updateData.contactCedula = dto.contactCedula;

    const [updated] = await db
      .update(tenants)
      .set(updateData)
      .where(eq(tenants.id, id))
      .returning();

    await this.auditHelper.logUpdate(undefined, 'tenant', previous, updated, {
      targetId: id,
      description: `Updated tenant ${previous.name}`,
    });

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
}
