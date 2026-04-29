import { DRIZZLE_PROVIDER } from '@/database/drizzle-provider';
import * as schema from '@/database/schema';
import {
  AUDIT_ACTIONS,
  auditEvents,
  SEVERITY_LEVELS,
  SYSTEM_EVENT_TYPES,
  systemEvents,
} from '@/database/schema/tables';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

export interface AuditEventData {
  action: string;
  targetType: string;
  targetId?: string | number;
  targetCedula?: string;
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  changes?: Record<string, any>;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  geoLocation?: Record<string, any>;
}

export interface SystemEventData {
  severity: string;
  eventType: string;
  source: string;
  message: string;
  stackTrace?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  tenantId?: string;
  requestPath?: string;
  requestMethod?: string;
  requestBody?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditEventService {
  private readonly logger = new Logger(AuditEventService.name);
  private readonly eventQueue: AuditEventData[] = [];
  private readonly systemEventQueue: SystemEventData[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    @Inject(DRIZZLE_PROVIDER) private db: NodePgDatabase<typeof schema>,
  ) {
    this.startFlushInterval();
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  async emit(event: AuditEventData) {
    this.eventQueue.push(event);
    this.logger.debug(
      `Audit event queued: ${event.action} on ${event.targetType}`,
    );

    if (this.eventQueue.length >= 100) {
      this.flush();
    }
  }

  async emitSystem(event: SystemEventData) {
    this.systemEventQueue.push(event);
    this.logger.debug(
      `System event queued: ${event.eventType} - ${event.message}`,
    );

    if (this.systemEventQueue.length >= 50) {
      this.flushSystem();
    }
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue.length = 0;

    try {
      await this.db.insert(auditEvents).values(
        events.map((e) => ({
          action: e.action as any,
          targetType: e.targetType as any,
          targetId: e.targetId?.toString(),
          targetCedula: e.targetCedula,
          userId: e.userId,
          tenantId: e.tenantId,
          correlationId: e.correlationId,
          changes: e.changes,
          previousValues: e.previousValues,
          newValues: e.newValues,
          description: e.description,
          metadata: e.metadata,
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
          deviceFingerprint: e.deviceFingerprint,
          geoLocation: e.geoLocation,
        })),
      );
      this.logger.log(`Flushed ${events.length} audit events to database`);
    } catch (error) {
      this.logger.error(`Failed to flush audit events: ${error}`);
      this.eventQueue.push(...events);
    }
  }

  async flushSystem() {
    if (this.systemEventQueue.length === 0) return;

    const events = [...this.systemEventQueue];
    this.systemEventQueue.length = 0;

    try {
      await this.db.insert(systemEvents).values(
        events.map((e) => ({
          severity: e.severity as any,
          eventType: e.eventType as any,
          source: e.source,
          message: e.message,
          stackTrace: e.stackTrace,
          userId: e.userId,
          sessionId: e.sessionId,
          correlationId: e.correlationId,
          tenantId: e.tenantId,
          requestPath: e.requestPath,
          requestMethod: e.requestMethod,
          requestBody: e.requestBody,
          metadata: e.metadata,
        })),
      );
      this.logger.log(`Flushed ${events.length} system events to database`);
    } catch (error) {
      this.logger.error(`Failed to flush system events: ${error}`);
      this.systemEventQueue.push(...events);
    }
  }

  onModuleDestroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
    this.flushSystem();
  }
}

@Injectable()
export class AuditHelper {
  constructor(private readonly auditService: AuditEventService) {}

  async logCreate(
    userId: string | undefined,
    targetType: string,
    newRecord: Record<string, any>,
    options?: {
      tenantId?: string;
      correlationId?: string;
      targetId?: string | number;
      targetCedula?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ) {
    await this.auditService.emit({
      action: AUDIT_ACTIONS.CREATE,
      targetType,
      targetId: options?.targetId,
      targetCedula: options?.targetCedula,
      userId,
      tenantId: options?.tenantId,
      correlationId: options?.correlationId,
      newValues: newRecord,
      description: options?.description || `Created ${targetType}`,
      metadata: options?.metadata,
    });
  }

  async logUpdate(
    userId: string | undefined,
    targetType: string,
    previousRecord: Record<string, any>,
    newRecord: Record<string, any>,
    options?: {
      tenantId?: string;
      correlationId?: string;
      targetId?: string | number;
      targetCedula?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ) {
    const changes: Record<string, any> = {};

    if (previousRecord && newRecord) {
      for (const [key, value] of Object.entries(newRecord)) {
        if (
          previousRecord[key] !== value &&
          !(
            previousRecord[key] instanceof Date &&
            value instanceof Date &&
            previousRecord[key].getTime() === value.getTime()
          )
        ) {
          changes[key] = {
            from: previousRecord[key],
            to: value,
          };
        }
      }
    }

    await this.auditService.emit({
      action: AUDIT_ACTIONS.UPDATE,
      targetType,
      targetId: options?.targetId,
      targetCedula: options?.targetCedula,
      userId,
      tenantId: options?.tenantId,
      correlationId: options?.correlationId,
      changes,
      previousValues: previousRecord,
      newValues: newRecord,
      description: options?.description || `Updated ${targetType}`,
      metadata: options?.metadata,
    });
  }

  async logDelete(
    userId: string | undefined,
    targetType: string,
    deletedRecord: Record<string, any>,
    options?: {
      tenantId?: string;
      correlationId?: string;
      targetId?: string | number;
      targetCedula?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ) {
    await this.auditService.emit({
      action: AUDIT_ACTIONS.DELETE,
      targetType,
      targetId: options?.targetId,
      targetCedula: options?.targetCedula,
      userId,
      tenantId: options?.tenantId,
      correlationId: options?.correlationId,
      previousValues: deletedRecord,
      description: options?.description || `Deleted ${targetType}`,
      metadata: options?.metadata,
    });
  }

  async logRead(
    userId: string | undefined,
    targetType: string,
    options?: {
      tenantId?: string;
      correlationId?: string;
      targetId?: string | number;
      targetCedula?: string;
      description?: string;
      metadata?: Record<string, any>;
    },
  ) {
    await this.auditService.emit({
      action: AUDIT_ACTIONS.READ,
      targetType,
      userId,
      tenantId: options?.tenantId,
      correlationId: options?.correlationId,
      targetId: options?.targetId,
      targetCedula: options?.targetCedula,
      description: options?.description || `Read ${targetType}`,
      metadata: options?.metadata,
    });
  }
}

@Injectable()
export class SystemEventHelper {
  constructor(private readonly auditService: AuditEventService) {}

  async logError(
    eventType: string,
    source: string,
    message: string,
    options?: {
      severity?: string;
      stackTrace?: string;
      userId?: string;
      sessionId?: string;
      correlationId?: string;
      tenantId?: string;
      requestPath?: string;
      requestMethod?: string;
      requestBody?: Record<string, any>;
      metadata?: Record<string, any>;
    },
  ) {
    await this.auditService.emitSystem({
      severity: options?.severity || SEVERITY_LEVELS.ERROR,
      eventType,
      source,
      message,
      stackTrace: options?.stackTrace,
      userId: options?.userId,
      sessionId: options?.sessionId,
      correlationId: options?.correlationId,
      tenantId: options?.tenantId,
      requestPath: options?.requestPath,
      requestMethod: options?.requestMethod,
      requestBody: options?.requestBody,
      metadata: options?.metadata,
    });
  }

  async logDatabaseError(
    error: Error,
    context: string,
    options?: {
      userId?: string;
      sessionId?: string;
      correlationId?: string;
      tenantId?: string;
      requestPath?: string;
      requestMethod?: string;
      metadata?: Record<string, any>;
    },
  ) {
    await this.logError(
      SYSTEM_EVENT_TYPES.DATABASE_ERROR,
      context,
      error.message,
      {
        severity: SEVERITY_LEVELS.ERROR,
        stackTrace: error.stack,
        ...options,
      },
    );
  }

  async logAuthenticationFailed(
    email: string,
    reason: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    },
  ) {
    await this.logError(
      SYSTEM_EVENT_TYPES.AUTHENTICATION_FAILED,
      'auth',
      `Authentication failed for ${email}: ${reason}`,
      {
        severity: SEVERITY_LEVELS.WARNING,
        ...options,
        metadata: {
          ...options?.metadata,
          email,
          reason,
        },
      },
    );
  }
}
