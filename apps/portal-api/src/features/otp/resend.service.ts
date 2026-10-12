import { Env } from '@/common/config/envs';
import { DRIZZLE_PROVIDER, DrizzleDatabase } from '@/database/drizzle-provider';
import { portalEmailLog } from '@/database/schema';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  template: string;
  accountId?: string | null;
}

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly client: Resend | null;
  private readonly from: string;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private readonly db: DrizzleDatabase,
    config: ConfigService<Env, true>,
  ) {
    const apiKey = config.get('RESEND_API_KEY', { infer: true });
    this.from = config.get('RESEND_FROM', { infer: true });
    this.client = apiKey ? new Resend(apiKey) : null;

    if (!this.client) {
      this.logger.warn(
        'RESEND_API_KEY no configurado: los correos no se enviarán (se registran en email_log).',
      );
    }
  }

  /** Envía un correo vía Resend y registra el intento en `portal.email_log`. */
  async send(params: SendEmailParams): Promise<{ providerId: string | null }> {
    const [log] = await this.db
      .insert(portalEmailLog)
      .values({
        accountId: params.accountId ?? null,
        template: params.template,
        toAddress: params.to,
        status: 'QUEUED',
      })
      .returning();

    if (!this.client) {
      await this.updateLog(
        log.id,
        'FAILED',
        null,
        'RESEND_API_KEY no configurado',
      );
      return { providerId: null };
    }

    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });

      if (error) {
        throw new Error(error.message ?? 'Error de Resend');
      }

      await this.updateLog(log.id, 'SENT', data?.id ?? null, null);
      return { providerId: data?.id ?? null };
    } catch (error) {
      this.logger.error(
        `Fallo al enviar correo (${params.template}): ${String(error)}`,
      );
      await this.updateLog(log.id, 'FAILED', null, String(error));
      // No propagamos: el OTP ya quedó registrado y la respuesta es genérica.
      return { providerId: null };
    }
  }

  private async updateLog(
    id: number,
    status: 'QUEUED' | 'SENT' | 'FAILED',
    providerId: string | null,
    error: string | null,
  ) {
    await this.db
      .update(portalEmailLog)
      .set({ status, providerId, error })
      .where(eq(portalEmailLog.id, id));
  }
}
