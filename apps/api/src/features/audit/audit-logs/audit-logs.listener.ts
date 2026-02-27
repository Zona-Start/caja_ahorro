import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLogEvent } from '../events/audit-log.event';
import { AuditLogsService } from './audit-logs.service';
import { CreateAuditLogsDto } from './dto/create-audit.dto';

@Injectable()
export class AuditLogsListener {
  private readonly logger = new Logger(AuditLogsListener.name);

  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Maneja el evento genérico de auditoría.
   * Se usa para todo tipo de operaciones auditables:
   * - Creación individual de asociados (action: INSERT)
   * - Carga masiva de asociados (action: DATA_IMPORT)
   * - Actualización de registros (action: UPDATE)
   * - Eliminaciones (action: DELETE)
   */
  @OnEvent('audit.log')
  async handleAuditLogEvent(event: AuditLogEvent) {
    try {
      const createAuditLogsDto: CreateAuditLogsDto = {
        tableName: event.tableName,
        recordId: event.recordId,
        action: event.action as any,
        userId: event.userId,
        area: event.area,
        description: event.description,
        previousData: event.previousData,
        newData: event.newData,
      };

      await this.auditLogsService.create(createAuditLogsDto);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Error al guardar el log de auditoría para la acción "${event.action}" en la tabla "${event.tableName}": ${message}`,
        stack,
      );
    }
  }

  /**
   * Maneja el evento específico para la creación individual de asociados.
   * Se emite cuando se registra un asociado de forma manual (uno a uno).
   */
  @OnEvent('associate.created')
  async handleAssociateCreated(event: AuditLogEvent) {
    try {
      const createAuditLogsDto: CreateAuditLogsDto = {
        tableName: 'associates',
        recordId: event.recordId,
        action: 'INSERT' as any,
        userId: event.userId,
        area: 'savings_banks',
        description:
          event.description ||
          `Asociado creado individualmente (ID: ${event.recordId})`,
        previousData: undefined,
        newData: event.newData,
      };

      await this.auditLogsService.create(createAuditLogsDto);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Error al guardar log de creación individual de asociado: ${message}`,
        stack,
      );
    }
  }

  /**
   * Maneja el evento específico para la carga masiva de asociados.
   * Se emite al procesar un archivo Excel con múltiples asociados.
   * El newData contiene: { total, inserted, skipped }
   */
  @OnEvent('associate.bulk_upload')
  async handleAssociateBulkUpload(event: AuditLogEvent) {
    try {
      const { total, inserted, skipped } =
        (event.newData as {
          total: number;
          inserted: number;
          skipped: number;
        }) || {};

      const createAuditLogsDto: CreateAuditLogsDto = {
        tableName: 'associates',
        recordId: 'bulk',
        action: 'DATA_IMPORT' as any,
        userId: event.userId,
        area: 'savings_banks',
        description:
          event.description ||
          `Carga masiva de asociados: ${total} en archivo, ${inserted} insertados, ${skipped} omitidos.`,
        previousData: undefined,
        newData: event.newData,
      };

      await this.auditLogsService.create(createAuditLogsDto);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(
        `Error al guardar log de carga masiva de asociados: ${message}`,
        stack,
      );
    }
  }
}
