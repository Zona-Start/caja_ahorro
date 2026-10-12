import { Env } from '@/common/config/envs';
import { SecurityService } from '@/common/security/security.service';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import { portalOtpCodes } from '@/database/schema';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, gt, gte, isNotNull, isNull } from 'drizzle-orm';
import { ResendService } from './resend.service';

export type OtpPurpose = 'EMAIL_VERIFY' | 'PHONE_VERIFY' | 'RESET' | 'STEP_UP';

const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const REQUEST_WINDOW_MAX = 3;

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly ttlMs: number;
  private readonly maxAttempts: number;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    private readonly security: SecurityService,
    private readonly resend: ResendService,
    config: ConfigService<Env, true>,
  ) {
    this.ttlMs = config.get('OTP_TTL_SECONDS', { infer: true }) * 1000;
    this.maxAttempts = config.get('OTP_MAX_ATTEMPTS', { infer: true });
  }

  /**
   * Crea y envía un código OTP por correo.
   * @returns el código generado (solo para tests internos; no se expone al cliente).
   */
  async requestEmailCode(params: {
    accountId: string;
    purpose: OtpPurpose;
    destination: string;
    /** Dirección de correo a la que se envía (por defecto = destination). */
    sendTo?: string;
  }): Promise<void> {
    // Rate limit por cuenta + propósito.
    const since = new Date(Date.now() - REQUEST_WINDOW_MS);
    const recent = await this.db
      .select({ id: portalOtpCodes.id })
      .from(portalOtpCodes)
      .where(
        and(
          eq(portalOtpCodes.accountId, params.accountId),
          eq(portalOtpCodes.purpose, params.purpose),
          gte(portalOtpCodes.createdAt, since),
        ),
      );

    if (recent.length >= REQUEST_WINDOW_MAX) {
      throw new BadRequestException(
        'Ha solicitado demasiados códigos. Intente más tarde.',
      );
    }

    // Invalidar códigos previos no consumidos del mismo propósito.
    await this.db
      .update(portalOtpCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(portalOtpCodes.accountId, params.accountId),
          eq(portalOtpCodes.purpose, params.purpose),
          isNull(portalOtpCodes.consumedAt),
        ),
      );

    const code = this.security.generateNumericCode(6);

    await this.db.insert(portalOtpCodes).values({
      accountId: params.accountId,
      purpose: params.purpose,
      destination: params.destination,
      codeHash: this.hashCode(params.purpose, params.destination, code),
      expiresAt: new Date(Date.now() + this.ttlMs),
    });

    await this.resend.send({
      to: params.sendTo ?? params.destination,
      subject: 'Tu código de verificación',
      template: `OTP_${params.purpose}`,
      accountId: params.accountId,
      html: this.buildEmail(code),
    });
  }

  /** Verifica un OTP (un solo uso, con límite de intentos). */
  async verifyCode(params: {
    accountId: string;
    purpose: OtpPurpose;
    code: string;
  }): Promise<{ destination: string }> {
    const record = await this.db.query.portalOtpCodes.findFirst({
      where: and(
        eq(portalOtpCodes.accountId, params.accountId),
        eq(portalOtpCodes.purpose, params.purpose),
        isNull(portalOtpCodes.consumedAt),
        gt(portalOtpCodes.expiresAt, new Date()),
      ),
      orderBy: [desc(portalOtpCodes.createdAt)],
    });

    if (!record) {
      throw new BadRequestException('Código inválido o expirado');
    }

    const attempts = record.attempts + 1;
    const expected = this.hashCode(
      params.purpose,
      record.destination,
      params.code,
    );
    const valid = this.security.safeEqual(expected, record.codeHash);

    if (!valid) {
      const exhausted = attempts >= this.maxAttempts;
      await this.db
        .update(portalOtpCodes)
        .set({ attempts, consumedAt: exhausted ? new Date() : null })
        .where(eq(portalOtpCodes.id, record.id));
      throw new BadRequestException('Código inválido o expirado');
    }

    await this.db
      .update(portalOtpCodes)
      .set({ consumedAt: new Date(), attempts })
      .where(eq(portalOtpCodes.id, record.id));

    return { destination: record.destination };
  }

  /** Comprueba si un destino fue verificado recientemente con un OTP consumido. */
  async findVerifiedDestination(
    accountId: string,
    purpose: OtpPurpose,
    destination: string,
    withinMs = 15 * 60 * 1000,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinMs);
    const row = await this.db.query.portalOtpCodes.findFirst({
      where: and(
        eq(portalOtpCodes.accountId, accountId),
        eq(portalOtpCodes.purpose, purpose),
        eq(portalOtpCodes.destination, destination),
        isNotNull(portalOtpCodes.consumedAt),
        gte(portalOtpCodes.consumedAt, since),
      ),
      orderBy: [desc(portalOtpCodes.consumedAt)],
    });
    return !!row;
  }

  private hashCode(purpose: string, destination: string, code: string): string {
    return this.security.hashToken(`${purpose}:${destination}:${code}`);
  }

  private buildEmail(code: string): string {
    const minutes = Math.round(this.ttlMs / 60000);
    return `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#111">Tu código de verificación</h2>
        <p style="color:#444">Usa el siguiente código para continuar. Expira en ${minutes} minutos.</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#111;margin:24px 0">${code}</p>
        <p style="color:#888;font-size:12px">Si no solicitaste este código, ignora este mensaje.</p>
      </div>
    `;
  }
}
