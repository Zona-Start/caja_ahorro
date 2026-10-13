import { PortalMemberContext } from '@/common/decorators/current-member.decorator';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { OtpService } from '../otp/otp.service';

export interface ProfileUpdateInput {
  phone?: string;
  email?: string;
  localityId?: number;
  address?: string;
}

@Injectable()
export class ProfileService {
  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly otp: OtpService,
  ) {}

  async getProfile(member: PortalMemberContext) {
    const account = await this.db.query.portalAccounts.findFirst({
      where: eq(schema.portalAccounts.id, member.accountId),
    });
    if (!account) throw new UnauthorizedException('Cuenta no válida');

    const associate = await this.db.query.associates.findFirst({
      where: and(
        eq(schema.associates.id, account.associateId),
        eq(schema.associates.tenantId, account.tenantId),
      ),
    });
    if (!associate) throw new NotFoundException('Asociado no encontrado');

    const [profileRow] = await this.db
      .select()
      .from(schema.portalAssociateProfile)
      .where(eq(schema.portalAssociateProfile.accountId, account.id))
      .limit(1);

    // La localidad completa (estado/municipio/parroquia) vive en el perfil del
    // portal. Si aún no se registró, se muestra solo el estado del ERP
    // (`associates.locality_id` referencia `core.states`).
    let locality: {
      id: number;
      state: string;
      municipality: string | null;
      parish: string | null;
    } | null = null;
    if (profileRow?.localityId) {
      locality = await this.resolveLocalityById(profileRow.localityId);
    } else if (associate.localityId) {
      locality = await this.resolveStateById(associate.localityId);
    }

    return {
      cedula: associate.cedula,
      fullname: associate.fullname,
      email: associate.email ?? account.email ?? null,
      phone: associate.phone ?? account.phone ?? null,
      address: profileRow?.address ?? null,
      locality,
      editableFields: ['phone', 'email', 'localityId', 'address'],
    };
  }

  async updateProfile(member: PortalMemberContext, dto: ProfileUpdateInput) {
    const account = await this.db.query.portalAccounts.findFirst({
      where: eq(schema.portalAccounts.id, member.accountId),
    });
    if (!account) throw new UnauthorizedException('Cuenta no válida');

    const associate = await this.db.query.associates.findFirst({
      where: and(
        eq(schema.associates.id, account.associateId),
        eq(schema.associates.tenantId, account.tenantId),
      ),
    });
    if (!associate) throw new NotFoundException('Asociado no encontrado');

    // Cambios de correo requieren verificación OTP previa del nuevo valor.
    if (dto.email !== undefined && dto.email !== (associate.email ?? null)) {
      const ok = await this.otp.findVerifiedDestination(
        account.id,
        'EMAIL_VERIFY',
        dto.email,
      );
      if (!ok) {
        throw new ForbiddenException(
          'Debes verificar el nuevo correo electrónico antes de cambiarlo',
        );
      }
    }

    // Si llega una localidad (estado+municipio+parroquia = core.localities),
    // se deriva su ESTADO para `savings.associates.locality_id` (FK a core.states).
    let localityStateId: number | undefined;
    if (dto.localityId !== undefined) {
      const [loc] = await this.db
        .select({ id: schema.localities.id, stateId: schema.localities.stateId })
        .from(schema.localities)
        .where(eq(schema.localities.id, dto.localityId))
        .limit(1);
      if (!loc) throw new BadRequestException('Localidad inválida');
      localityStateId = loc.stateId;
    }

    // 1) Actualizar columnas allowlist en savings.associates.
    const assocSet: {
      phone?: string | null;
      email?: string | null;
      localityId?: number | null;
    } = {};
    if (dto.phone !== undefined) assocSet.phone = dto.phone;
    if (dto.email !== undefined) assocSet.email = dto.email;
    if (localityStateId !== undefined) assocSet.localityId = localityStateId;

    if (Object.keys(assocSet).length > 0) {
      await this.db
        .update(schema.associates)
        .set(assocSet)
        .where(
          and(
            eq(schema.associates.id, associate.id),
            eq(schema.associates.tenantId, account.tenantId),
          ),
        );
    }

    // 2) Upsert del perfil del portal (dirección + localidad completa).
    const profileSet: {
      address?: string | null;
      localityId?: number | null;
      syncedAt: Date;
    } = { syncedAt: new Date() };
    if (dto.address !== undefined) profileSet.address = dto.address;
    if (dto.localityId !== undefined) profileSet.localityId = dto.localityId;

    await this.db
      .insert(schema.portalAssociateProfile)
      .values({
        accountId: account.id,
        tenantId: account.tenantId,
        address: dto.address ?? null,
        localityId: dto.localityId ?? null,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.portalAssociateProfile.accountId,
        set: profileSet,
      });

    // 3) Sincronizar espejos de contacto en la cuenta (para OTP/login).
    const accountSet: {
      email?: string;
      phone?: string;
      emailVerifiedAt?: Date;
      phoneVerifiedAt?: Date;
    } = {};
    if (dto.email !== undefined) {
      accountSet.email = dto.email;
      accountSet.emailVerifiedAt = new Date();
    }
    if (dto.phone !== undefined) {
      accountSet.phone = dto.phone;
      accountSet.phoneVerifiedAt = new Date();
    }
    if (Object.keys(accountSet).length > 0) {
      await this.db
        .update(schema.portalAccounts)
        .set(accountSet)
        .where(eq(schema.portalAccounts.id, account.id));
    }

    await this.db.insert(schema.portalAccessLog).values({
      accountId: account.id,
      tenantId: account.tenantId,
      event: 'PROFILE_UPDATE',
      metadata: { fields: Object.keys(dto) },
    });

    return this.getProfile(member);
  }

  /** Localidad completa (core.localities) → estado/municipio/parroquia. */
  private async resolveLocalityById(id: number) {
    const [row] = await this.db
      .select({
        id: schema.localities.id,
        state: schema.states.name,
        municipality: schema.municipalities.name,
        parish: schema.parishes.name,
      })
      .from(schema.localities)
      .innerJoin(schema.states, eq(schema.localities.stateId, schema.states.id))
      .innerJoin(
        schema.municipalities,
        eq(schema.localities.municipalityId, schema.municipalities.id),
      )
      .innerJoin(
        schema.parishes,
        eq(schema.localities.parishId, schema.parishes.id),
      )
      .where(eq(schema.localities.id, id))
      .limit(1);

    return row ?? null;
  }

  /** Solo el estado (associates.locality_id → core.states). */
  private async resolveStateById(id: number) {
    const [row] = await this.db
      .select({ id: schema.states.id, name: schema.states.name })
      .from(schema.states)
      .where(eq(schema.states.id, id))
      .limit(1);

    return row
      ? { id: row.id, state: row.name, municipality: null, parish: null }
      : null;
  }
}
