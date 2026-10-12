import { Env } from '@/common/config/envs';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ProvisioningService } from './provisioning.service';

/**
 * Aprovisionamiento automático:
 * - Cron diario (por defecto 06:00, `PORTAL_PROVISIONING_CRON`).
 * - Una pasada adicional al arrancar (`PORTAL_PROVISIONING_RUN_ON_START`), útil tras
 *   reinicios del servidor.
 * Se activa con `PORTAL_PROVISIONING_ENABLED=true` (activo por defecto).
 */
@Injectable()
export class ProvisioningScheduler implements OnModuleInit {
  private readonly logger = new Logger(ProvisioningScheduler.name);

  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly provisioning: ProvisioningService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onModuleInit(): void {
    const enabled = this.config.get('PORTAL_PROVISIONING_ENABLED', {
      infer: true,
    });
    if (!enabled) {
      this.logger.log('Aprovisionamiento automático deshabilitado.');
      return;
    }

    const expression = this.config.get('PORTAL_PROVISIONING_CRON', {
      infer: true,
    });
    const timeZone = this.config.get('PORTAL_PROVISIONING_TZ', {
      infer: true,
    });

    const job = new CronJob(
      expression,
      () => void this.safeRun('cron'),
      null,
      false,
      timeZone,
    );
    this.registry.addCronJob('portal-provisioning', job);
    job.start();
    this.logger.log(
      `Aprovisionamiento automático activo (${expression} · ${timeZone}).`,
    );

    const runOnStart = this.config.get('PORTAL_PROVISIONING_RUN_ON_START', {
      infer: true,
    });
    if (runOnStart) {
      this.logger.log('Ejecutando aprovisionamiento al arrancar…');
      void this.safeRun('inicio');
    }
  }

  private async safeRun(source: 'cron' | 'inicio'): Promise<void> {
    try {
      const r = await this.provisioning.runAll();
      this.logger.log(
        `Aprovisionamiento (${source}): tenants=${r.tenants} nuevos=${r.created} de ${r.total}.`,
      );
    } catch (error) {
      this.logger.error(`Fallo aprovisionando (${source}): ${String(error)}`);
    }
  }
}
